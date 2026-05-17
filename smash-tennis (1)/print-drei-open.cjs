const fs = require('fs');
const txt = fs.readFileSync('node_modules/.vite/deps/@react-three_drei.js', 'utf8');
const lines = txt.split('\n');
lines.forEach(l => {
   if (l.includes('.open =') || l.includes('.open=')) console.log(l.trim());
});
