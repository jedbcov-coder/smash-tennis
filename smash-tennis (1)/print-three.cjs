const fs = require('fs');
const path = require('path');

function searchThree() {
  const q = ['node_modules/three'];
  while (q.length > 0) {
    const p = q.pop();
    let stats;
    try { stats = fs.statSync(p); } catch(e){ continue; }
    if (stats.isDirectory()) {
      const files = fs.readdirSync(p);
      files.forEach(f => q.push(path.join(p, f)));
    } else if (p.endsWith('.js') || p.endsWith('.mjs')) {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('open =') || txt.includes('open=')) {
        const matches = [...txt.matchAll(/.{0,15}open\s*=\s*.{0,15}/g)];
        matches.forEach(m => console.log('FOUND IN THREE:', p, m[0]));
      }
    }
  }
}
searchThree();
