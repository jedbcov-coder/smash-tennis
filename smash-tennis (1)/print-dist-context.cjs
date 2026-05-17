const fs = require('fs');

const files = fs.readdirSync('dist/assets');
files.forEach(f => {
   if (!f.endsWith('.js')) return;
   const txt = fs.readFileSync('dist/assets/' + f, 'utf8');
   const idx = txt.indexOf('open=!0');
   if (idx !== -1) {
      console.log('Found in', f);
      console.log(txt.slice(Math.max(0, idx - 100), idx + 100));
   }
});
