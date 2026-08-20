const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

// 1. Remove the Staff KPI card
const staffCardRegex = /<div\s*className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 shadow-md shadow-amber-200">[\s\S]*?Health officers & staff[\s\S]*?<\/p>\s*<\/div>/;
file = file.replace(staffCardRegex, '');

// 2. Remove staffCount declaration
file = file.replace(/const staffCount = users\.filter\(\(u\) => u\.role === 'Staff'\)\.length;\s*/, '');

// 3. Fix endpoint logic
file = file.replace(
  "const endpoint = formData.role === 'Doctor' ? '/admin/doctors' : '/admin/staff';",
  "const endpoint = '/admin/doctors';"
);

// 4. Remove the Staff forms block entirely
const staffFormRegex = /\{formData\.role === 'Staff'[\s\S]*?<\/div>\s*\)\}/;
file = file.replace(staffFormRegex, '');

// 5. Replace 'Permanent Staff' string with 'Permanent Doctor'
file = file.replace(/'?? Permanent Staff'/g, "'?? Permanent'");

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Fully removed Staff');
