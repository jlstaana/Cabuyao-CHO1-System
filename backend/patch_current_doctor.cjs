const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const regex = /scheduleLabel: currentDoctorStatus\.availability\?\.length[\s\S]*?\?\scurrentDoctorStatus\.availability\.map[^\n]+\.join\(\', \'\)[\s\S]*?\:\s'Available without fixed schedule',/;
file = file.replace(regex, "scheduleLabel: availabilityLabel(currentDoctorStatus.availability),");
fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched current doctor scheduleLabel');
