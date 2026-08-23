const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(
  /<div data-tour="page-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">/,
  '<div data-tour="page-stats" className="grid grid-cols-2 gap-3">'
);
file = file.replace(
  /<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-3">/,
  '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-1 gap-3">'
);


fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched grid 2');
