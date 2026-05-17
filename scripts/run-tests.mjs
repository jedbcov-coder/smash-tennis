import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const root = process.cwd();
const testFiles = [];
const tests = [];
const groupStack = [];

async function findTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      await findTestFiles(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      testFiles.push(fullPath);
    }
  }
}

function formatValue(value) {
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
}

function expect(received) {
  return {
    toBe(expected) {
      if (received !== expected) {
        throw new Error(`Expected ${formatValue(received)} to be ${formatValue(expected)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(received) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${formatValue(received)} to equal ${formatValue(expected)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(received > expected)) {
        throw new Error(`Expected ${formatValue(received)} to be greater than ${formatValue(expected)}`);
      }
    },
    toBeLessThan(expected) {
      if (!(received < expected)) {
        throw new Error(`Expected ${formatValue(received)} to be less than ${formatValue(expected)}`);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const tolerance = 10 ** -precision / 2;
      if (Math.abs(received - expected) > tolerance) {
        throw new Error(`Expected ${formatValue(received)} to be close to ${formatValue(expected)}`);
      }
    },
  };
}

function describe(name, callback) {
  groupStack.push(name);
  callback();
  groupStack.pop();
}

function it(name, callback) {
  tests.push({ name: [...groupStack, name].join(' > '), callback });
}

globalThis.describe = describe;
globalThis.it = it;
globalThis.test = it;
globalThis.expect = expect;

await findTestFiles(path.join(root, 'src'));
testFiles.sort();

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});

try {
  for (const file of testFiles) {
    await server.ssrLoadModule(pathToFileURL(file).href);
  }

  let failures = 0;

  for (const testCase of tests) {
    try {
      await testCase.callback();
      console.log(`✓ ${testCase.name}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${testCase.name}`);
      console.error(error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n${tests.length - failures}/${tests.length} tests passed`);

  if (failures > 0) {
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
