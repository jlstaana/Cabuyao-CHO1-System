const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Replace corrupted A with |
file = file.replace(/A\uFFFD/g, "|");
file = file.replace(/A/g, "|"); // Just in case it reads it exactly like this

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched corrupted character');
