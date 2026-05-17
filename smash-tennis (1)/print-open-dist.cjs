const fs = require('fs');
const files = fs.readdirSync('dist/assets');
files.forEach(f => {
  if (f.endsWith('.js')) {
    const txt = fs.readFileSync('dist/assets/' + f, 'utf8');
    const matches = [...txt.matchAll(/.{0,50}open=!0.{0,50}/g)];
    matches.forEach(m => console.log('IN', f, 'FOUND:', m[0]));
    
    // Also search for open=!1 and open=true and open=false
    const strMatch = txt.match(/.{0,50}(open=!1|open=true|open=false|open\s*=\s*true|open\s*=\s*false).{0,50}/g);
    if (strMatch) {
       strMatch.forEach(m => console.log('IN', f, 'FOUND:', m));
    }
  }
});
