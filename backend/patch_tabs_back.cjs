const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/\{?\['Scheduled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Restored tabs to Doctor queue');
