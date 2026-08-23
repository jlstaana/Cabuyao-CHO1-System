const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Fix the variables
file = file.replace(/const pending\s*=\s*consultations\.filter\(c => c\.status === 'Pending'\);/, "const scheduled = consultations.filter(c => c.status === 'Scheduled');");
file = file.replace(/const scheduled\s*=\s*consultations\.filter\(c => c\.status === 'Scheduled'\);/, "const completed = consultations.filter(c => c.status === 'Completed');");
file = file.replace(/const completed\s*=\s*consultations\.filter\(c => c\.status === 'Completed'\);/, "const cancelled = consultations.filter(c => c.status === 'Cancelled' || c.status === 'Missed');");

file = file.replace(/const counts = \{ Pending: pending\.length, Scheduled: scheduled\.length, Completed: completed\.length \};/, "const counts = { Scheduled: scheduled.length, Completed: completed.length, Cancelled: cancelled.length };");
file = file.replace(/const baseFiltered = tab === 'Pending' \? pending : tab === 'Scheduled' \? scheduled : completed;/, "const baseFiltered = tab === 'Scheduled' ? scheduled : tab === 'Completed' ? completed : cancelled;");

// Fix the interactive stat cards block
const badCardsBlock = `{[
          { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          ].map(s => (`;

// We'll replace it safely
file = file.replace(/\{\s*\[\s*\{\s*label:\s*'Pending'[\s\S]*?\]\.map\(s => \(/, 
`{[
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
          { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
        ].map(s => (`);

// And finally the tabs
file = file.replace(/\{?\['Scheduled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");
// Wait, in previous patch I replaced `['Scheduled'].map` with `['Scheduled', 'Completed', 'Cancelled'].map`.
// Let's verify if the tabs are already correct.

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched DoctorView correctly');
