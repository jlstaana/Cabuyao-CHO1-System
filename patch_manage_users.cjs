const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

// 1. Remove Staff from filters
file = file.replace(
  "{['All', 'Admin', 'Doctor', 'Staff', 'Patient', 'Inactive'].map((role) => (",
  "{['All', 'Admin', 'Doctor', 'Patient', 'Inactive'].map((role) => ("
);

// 2. Remove Staff from creation dropdown
file = file.replace(
  '<option value="Staff">Staff</option>',
  ''
);

// 3. Remove Staff KPI card (lines around 267-274)
const kpiRegex = /<div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">[\s\S]*?Staff[\s\S]*?<\/div>/;
file = file.replace(kpiRegex, '');

// 4. Remove Staff from description
file = file.replace(
  'Create doctor & staff accounts, assign visiting doctor access, and manage credentials.',
  'Create doctor accounts, assign visiting doctor access, and manage credentials.'
);

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Patched ManageUsers');
