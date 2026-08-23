const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// The DoctorView tabs array
file = file.replace(/\{?\['Pending', 'Scheduled', 'Completed'\]\.map\(t => \{/g, "{['Scheduled'].map(t => {");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched Doctor tabs');
