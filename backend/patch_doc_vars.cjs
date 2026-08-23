const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const oldVars = `  const pending   = consultations.filter(c => c.status === 'Pending');
  const scheduled = consultations.filter(c => c.status === 'Scheduled');
  const completed = consultations.filter(c => c.status === 'Completed');

  const counts = { Pending: pending.length, Scheduled: scheduled.length, Completed: completed.length };
  const baseFiltered = tab === 'Pending' ? pending : tab === 'Scheduled' ? scheduled : completed;`;

const newVars = `  const scheduled = consultations.filter(c => c.status === 'Scheduled');
  const completed = consultations.filter(c => c.status === 'Completed');
  const cancelled = consultations.filter(c => c.status === 'Cancelled' || c.status === 'Missed');

  const counts = { Scheduled: scheduled.length, Completed: completed.length, Cancelled: cancelled.length };
  const baseFiltered = tab === 'Scheduled' ? scheduled : tab === 'Completed' ? completed : cancelled;`;

file = file.replace(oldVars, newVars);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched DoctorView vars');
