const fs = require('fs');

const txt = fs.readFileSync('node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js', 'utf8');
const idx = txt.indexOf('open=');
if (idx !== -1 || txt.indexOf('open =') !== -1) {
   console.log("FOUND!");
} else {
   console.log("NOT FOUND in index, searching line by line");
}
