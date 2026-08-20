const fs = require('fs');
let file = fs.readFileSync('frontend/src/utils/navigation.js', 'utf-8');

file = file.replace(
  "{ path: '/consultations',  label: 'Consultation Queue',      icon: Stethoscope },",
  "{ path: '/consultations',  label: 'Consultation Queue',      icon: Stethoscope },\n          { path: '/consultation-history', label: 'Consultation History', icon: Clock },"
);

file = file.replace(
  "{ path: '/consultations',  label: 'Manage Consultations',    icon: Stethoscope },",
  "{ path: '/consultations',  label: 'Manage Consultations',    icon: Stethoscope },\n          { path: '/consultation-history', label: 'Consultation History', icon: Clock },"
);

fs.writeFileSync('frontend/src/utils/navigation.js', file);
console.log('Fixed nav');
