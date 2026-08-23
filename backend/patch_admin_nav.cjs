const fs = require('fs');
let file = fs.readFileSync('../frontend/src/utils/navigation.js', 'utf-8');

const oldNav = `      {
        label: 'Patient Records',
        links: [
          { path: '/consultations', label: 'View Patient Records',   icon: ClipboardList },
        ],
      },`;

const newNav = `      {
        label: 'Consultations',
        links: [
          { path: '/consultations', label: 'Consultation Queue',   icon: Stethoscope },
          { path: '/patient-records', label: 'Patient Records',    icon: ClipboardList },
        ],
      },`;

file = file.replace(oldNav, newNav);
fs.writeFileSync('../frontend/src/utils/navigation.js', file);
console.log('Patched Admin nav');
