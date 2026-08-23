const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// 1. DoctorView tabs array
file = file.replace(/\{\['Pending',\s*'Scheduled',\s*'Completed'\]\.map\(t\s*=>\s*\{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

// 2. DoctorView badge logic
file = file.replace(/\{counts\[t\] > 0 && t === 'Pending' && \([\s\S]*?\}\)/g, "");

// 3. AdminView Tabs array
file = file.replace(/\{\['Pending',\s*'Scheduled'\]\.map\(t\s*=>\s*\{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed robustly');
