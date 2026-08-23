const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

// 1. Fix characters
file = file.replace(/A\uFFFD/g, " | ");
file = file.replace(/·/g, " | ");

// 2. Fix date of birth raw timestamp
file = file.replace(/value=\{`\$\{patient\.dob\} \(\$\{calcAge\(patient\.dob\)\} years old\)`\}/g, "value={`\\${formatDate(patient.dob)} (\\${calcAge(patient.dob)} years old)`}");
file = file.replace(/\\\$/g, "$");

// 3. Remove vitals safely
// a) Remove tab array entry
file = file.replace(/\{\s*key:\s*'vitals',\s*label:\s*'Vital Signs',\s*icon:\s*HeartPulse\s*\},\s*/g, "");

// b) Remove the specific button
const btnOld = `<button
                              onClick={() => setTab(patient.id, 'vitals')}
                              className="flex items-center gap-2 px-4 py-2 bg-danger-bg text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
                            >
                              <HeartPulse size={15} /> View Vitals
                            </button>`;
file = file.replace(btnOld, "");

// c) Remove the vitals tab content using exact string slicing
const vStart = file.lastIndexOf("{/*", file.indexOf("Vitals tab"));
const iStart = file.lastIndexOf("{/*", file.indexOf("Images tab"));
if (vStart !== -1 && iStart !== -1 && iStart > vStart) {
  file = file.substring(0, vStart) + file.substring(iStart);
}

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', file);
console.log('Applied safe patches');
