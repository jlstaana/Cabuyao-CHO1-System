const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Replace the inline logic
const regex = /scheduleLabel:\s*currentDoctorStatus\.availability\?\.length[\s\S]*?'Available without fixed schedule',/;
const newLogic = `scheduleLabel: formatScheduleSummary(currentDoctorStatus.availability),`;

f = f.replace(regex, newLogic);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Patched schedule summary effectively');
