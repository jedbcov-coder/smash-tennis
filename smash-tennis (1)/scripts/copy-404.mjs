import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist');
const indexFile = path.join(distPath, 'index.html');
const destFile = path.join(distPath, '404.html');

if (fs.existsSync(indexFile)) {
  fs.copyFileSync(indexFile, destFile);
  console.log('Copied index.html to 404.html');
}
