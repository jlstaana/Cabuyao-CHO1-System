const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace('Needed Specialization', 'Available Doctor Specialization');

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed label');
