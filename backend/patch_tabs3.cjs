const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Patient tabs
file = file.replace(/const tabs = \['Pending', 'Scheduled'\];/, "const tabs = ['Scheduled'];");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched tabs 3');
