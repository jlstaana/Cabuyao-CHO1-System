const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

f = f.replace(/<div data-tour="page-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">/, '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">');

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed admin grid');
