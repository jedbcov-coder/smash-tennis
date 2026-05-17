const fs = require('fs');
const files = fs.readdirSync('dist/assets');
files.forEach(f => {
  if (f.endsWith('.js')) {
    const txt = fs.readFileSync('dist/assets/' + f, 'utf8');
    const matches = [...txt.matchAll(/.{0,50}window\.open.{0,50}/g)];
    matches.forEach(m => console.log('IN', f, 'FOUND:', m[0]));
  }
});
