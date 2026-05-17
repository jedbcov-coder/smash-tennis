const fs = require('fs');
const execSync = require('child_process').execSync;

try {
  const result = execSync('grep -rn "open =" node_modules/', { maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' });
  const lines = result.split('\n');
  fs.writeFileSync('open-search.log', lines.slice(0, 50).join('\n'));
  console.log("Found: open =", lines.length);
} catch (e) {
  console.log("No open =");
}

try {
  const result2 = execSync('grep -rn "open=" node_modules/', { maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' });
  const lines2 = result2.split('\n');
  fs.writeFileSync('open-search2.log', lines2.slice(0, 50).join('\n'));
  console.log("Found: open=", lines2.length);
} catch (e) {
  console.log("No open=");
}

