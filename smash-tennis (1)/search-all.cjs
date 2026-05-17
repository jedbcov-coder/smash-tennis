const fs = require('fs');
const path = require('path');

function searchForOpenAssignment(dir) {
  let found = [];
  const q = [dir];
  while (q.length > 0) {
    const p = q.pop();
    let stats;
    try { stats = fs.statSync(p); } catch(e){ continue; }
    if (stats.isDirectory()) {
      if (p.includes('.git') || p.includes('.bin')) continue;
      const files = fs.readdirSync(p);
      files.forEach(f => q.push(path.join(p, f)));
    } else if (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs') || p.endsWith('.ts')) {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('.open =') || txt.includes('.open=') || txt.includes('["open"] =') || txt.includes("['open'] =")) {
        console.log('Found possible assignment in:', p);
      }
    }
  }
}
searchForOpenAssignment('node_modules');
searchForOpenAssignment('dist');
searchForOpenAssignment('src');
