const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(
  /\{\[\s*\{\s*label:\s*'Pending',\s*status:\s*'Pending',\s*count:\s*pending\.length,\s*sub:\s*'Needs review'\s*\},\s*/g,
  "{[\n          "
);

file = file.replace(
  /\{\['Pending', 'Scheduled', 'Completed'\]\.map\(t => \{/g,
  "{['Scheduled', 'Completed'].map(t => {"
);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched tabs');
