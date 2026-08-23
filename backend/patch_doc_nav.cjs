const fs = require('fs');
let file = fs.readFileSync('../frontend/src/utils/navigation.js', 'utf-8');

const doctorSectionStart = file.indexOf("if (role === 'Doctor') {");
const adminSectionStart = file.indexOf("if (role === 'Admin') {");

const doctorSection = file.substring(doctorSectionStart, adminSectionStart);
const newDoctorSection = doctorSection.replace(/\{\s*path:\s*'\/consultation-history',\s*label:\s*'Consultation History',\s*icon:\s*Clock\s*\},\s*/, '');

file = file.substring(0, doctorSectionStart) + newDoctorSection + file.substring(adminSectionStart);

fs.writeFileSync('../frontend/src/utils/navigation.js', file);
console.log('Removed Consultation History from Doctor sidebar');
