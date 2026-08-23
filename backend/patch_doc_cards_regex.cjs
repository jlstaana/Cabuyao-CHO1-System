const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

f = f.replace(/\{\s*label:\s*'Pending',\s*status:\s*'Pending',\s*count:\s*pending\.length,\s*sub:\s*'Needs review'\s*\},\s*/g, "");

// While we're at it, let's fix the completed card text to be consistent with Scheduled and Cancelled
f = f.replace(/\{\s*label:\s*'Completed',\s*status:\s*'Completed',\s*count:\s*completed\.length,\s*sub:\s*'Finished'\s*\}/g, "{ label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },\n            { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' }");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed Doctor cards with regex');
