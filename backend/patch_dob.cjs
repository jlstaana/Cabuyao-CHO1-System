const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

file = file.replace(/value=\{`\$\{patient\.dob\} \(\$\{calcAge\(patient\.dob\)\} years old\)`\}/g, "value={`\\${formatDate(patient.dob)} (\\${calcAge(patient.dob)} years old)`}");

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', file);
console.log('Fixed patient.dob bug');
