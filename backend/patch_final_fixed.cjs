const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Fix the DoctorView cards array which causes the ReferenceError
const docCardsOld = `        <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
            { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
            { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
          ].map(s => (`.replace(/\r\n/g, "\n");

const docCardsNew = `        <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
            { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
            { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
          ].map(s => (`.replace(/\r\n/g, "\n");

f = f.replace(new RegExp(docCardsOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), docCardsNew);

// Also I previously matched `{tab === 'Pending' ? 'No pending request.' : \`No \${tab.toLowerCase()} consultations.\`}` 
// and replaced it with `\`No \\${tab.toLowerCase()} consultations.\`` which output as literal JSX text.
// Let's replace the literal text with the evaluated JSX string properly!
f = f.replace(/`No \\\$\{tab\.toLowerCase\(\)\} consultations\.`/g, "{`No \\${tab.toLowerCase()} consultations.`}");

// And the 'Scheduled': literal text
f = f.replace(/'Scheduled': \{new/g, "Scheduled: {new");

// I also need to make sure AdminView cards are patched properly!
const adminCardsOld = `        {[
          
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Successfully finished' },
          { status: 'Cancelled', sub: 'Discontinued requests' }
        ].map(s => (`.replace(/\r\n/g, "\n");

const adminCardsNew = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Successfully finished' },
          { status: 'Cancelled', sub: 'Discontinued requests' }
        ].map(s => (`.replace(/\r\n/g, "\n");

f = f.replace(new RegExp(adminCardsOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), adminCardsNew);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed runtime ReferenceError!');
