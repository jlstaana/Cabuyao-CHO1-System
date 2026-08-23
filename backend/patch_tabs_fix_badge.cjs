const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/<Icon size=\{14\} \/> \{t\}[\s\S]*?<\/button>/g, "<Icon size={14} /> {t}\n              </button>");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed button closures');
