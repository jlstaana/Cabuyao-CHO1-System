const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

f = f.replace(
  'className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"',
  'className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"'
);

fs.writeFileSync('../frontend/src/pages/dashboard/ManageUsers.jsx', f);
console.log('Fixed ManageUsers grid layout');
