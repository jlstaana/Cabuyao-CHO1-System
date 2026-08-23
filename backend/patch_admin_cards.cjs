const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const oldCards = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          
          
        ].map(s => (`

const newCards = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Finished sessions' },
          { status: 'Cancelled', sub: 'Discontinued' },
        ].map(s => (`

file = file.replace(oldCards, newCards);
fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched Admin cards');
