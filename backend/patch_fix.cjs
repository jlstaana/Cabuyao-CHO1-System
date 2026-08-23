const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const target = '}-${String(slot.end_time';
const idx = f.indexOf(target);
if (idx !== -1) {
  const endIdx = f.indexOf(';', idx) + 1;
  f = f.slice(0, idx) + f.slice(endIdx);
  fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
  console.log('Fixed syntax error!');
} else {
  console.log('Could not find target');
}
