const fs = require('fs');
const path = require('path');

function searchForOpenAssignment(dir) {
  const q = [dir];
  while (q.length > 0) {
    const p = q.pop();
    let stats;
    try { stats = fs.statSync(p); } catch(e){ continue; }
    if (stats.isDirectory()) {
      if (p.includes('.git') || p.includes('.bin') || p.includes('vite/dist')) continue;
      const files = fs.readdirSync(p);
      files.forEach(f => q.push(path.join(p, f)));
    } else if (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs') || p.endsWith('.ts') || p.endsWith('.tsx')) {
      const txt = fs.readFileSync(p, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((l, i) => {
         if (/(^|[\s{};,])open\s*=\s*[^=]/.test(l)) {
            console.log(p + ':' + (i+1) + ': ' + l.trim());
         }
      });
    }
  }
}
searchForOpenAssignment('src');
searchForOpenAssignment('node_modules');
