const fs = require('fs');

const p = 'node_modules/troika-three-text/dist/troika-three-text.esm.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('.open =') || line.includes('.open=') || line.includes('["open"]=')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
