const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/MedicalImages.jsx', 'utf-8');

file = file.replace("'Lab Result',", "'Lab Test Results',");
file = file.replace("Upload X-rays, lab results, and other", "Upload X-rays, lab test results, and other");

fs.writeFileSync('frontend/src/pages/dashboard/MedicalImages.jsx', file);
console.log('Patched');
