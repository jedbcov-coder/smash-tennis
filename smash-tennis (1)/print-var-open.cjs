const fs = require('fs');

const lines = fs.readFileSync('node_modules/.vite/deps/@react-three_drei.js', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('var open = false;'));
if (idx !== -1) {
   for (let i = Math.max(0, idx - 10); i <= idx + 10; i++) {
      console.log(i + ': ' + lines[i]);
   }
}
