const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// The one I missed in Consultations.jsx
f = f.replace(/c\.status === 'Pending'/g, "c.status === 'DELETED_STATUS'");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed Consultations.jsx');
