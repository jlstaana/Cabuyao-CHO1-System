const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/\{\s*status:\s*'Pending',\s*sub:\s*'Awaiting assignment'\s*\},/g, "");
file = file.replace(/\{?\['Pending','Scheduled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched Admin tabs');
