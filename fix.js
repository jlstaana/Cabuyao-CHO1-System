const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');

const regex = /function getDoctorSlotsForDate[\s\S]*?function getDoctorSlotsForDate/;
file = file.replace(regex, 'function getDoctorSlotsForDate');

file = file.replace(/const \[viewMode, setViewMode\] = useState\('list'\);[\s\n]*const \[viewMode, setViewMode\] = useState\('list'\);[\s\n]*const \[viewMode, setViewMode\] = useState\('list'\);/g, "const [viewMode, setViewMode] = useState('list');");
file = file.replace(/const \[viewMode, setViewMode\] = useState\('list'\);[\s\n]*const \[viewMode, setViewMode\] = useState\('list'\);/g, "const [viewMode, setViewMode] = useState('list');");

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
