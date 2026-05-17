const fs = require('fs');
const files = fs.readdirSync('dist/assets');
files.forEach(f => {
  if (f.endsWith('.js')) {
    const txt = fs.readFileSync('dist/assets/' + f, 'utf8');
    const idx = txt.indexOf('open=');
    if (idx !== -1) console.log('Found open= in:', f, txt.slice(idx-100, idx+100));
  }
});
