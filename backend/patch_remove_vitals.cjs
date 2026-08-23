const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

// Remove the View Vitals button block
const buttonRegex = /<button[\s\n]+onClick=\{\(\) => setTab\(patient\.id, 'vitals'\)\}[\s\n]+className="flex items-center gap-2 px-4 py-2 bg-danger-bg text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"[\s\n]+>[\s\n]+<HeartPulse size=\{15\} \/> View Vitals[\s\n]+<\/button>/g;
f = f.replace(buttonRegex, '');

// Also replace the page description that mentions vitals
f = f.replace(/View medical history, vitals, images, and consultations for your patients\./g, 'View medical history, patient documents, and consultations for your patients.');

// Let's make sure we aren't displaying anything else related to vitals. 
// Did I remove the vitals tab itself?
// The output of the grep didn't show `{tab === 'vitals'}` so maybe I already removed the tab content, but just left the button.
// But let's verify if `{tab === 'vitals'}` exists.
f = f.replace(/\{\/\*.*?Vitals tab.*?(\n|.)*?(?=\{\/\*|$)/, '');
f = f.replace(/\{tab === 'vitals' && \([\s\S]*?\)\}/, '');
f = f.replace(/\{ key: 'vitals',\s*label: 'Vitals',\s*icon: HeartPulse \},/g, '');

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', f);
console.log('Removed vitals from PatientRecords');
