const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

file = file.replace(/\\\$/g, "$");

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', file);
console.log('Fixed escaped dollar signs');
