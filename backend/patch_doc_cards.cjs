const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const oldDocCards = `        <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
            { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
            ].map(s => (`

const newDocCards = `        <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
            { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
            { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
            ].map(s => (`

file = file.replace(oldDocCards, newDocCards);
fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched DoctorView cards');
