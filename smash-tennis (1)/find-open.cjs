const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
       if (file !== '.git' && file !== 'dist') search(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.cjs') || fullPath.endsWith('.mjs') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
       const content = fs.readFileSync(fullPath, 'utf8');
       if (content.includes('.open =') || content.includes('.open=') || content.includes('.open  =') || content.match(/Object\.defineProperty\(.*?'open'/)) {
         if (!fullPath.includes('puppeteer') && !fullPath.includes('typescript')) {
           console.log(fullPath);
         }
       }
    }
  }
}
search('node_modules');
