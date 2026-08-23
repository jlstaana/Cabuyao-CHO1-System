const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// AdminView tabs
f = f.replace(
  /\['Pending','Scheduled','Completed','Cancelled'\]/g,
  "['Scheduled','Completed','Cancelled']"
);

// Any other references to Pending in arrays
f = f.replace(
  /\['All', 'Pending', 'Scheduled', 'Completed', 'Cancelled'\]/g,
  "['All', 'Scheduled', 'Completed', 'Cancelled']"
);

// And the Pending actions block
f = f.replace(
  /\c\.status === 'Pending'/g,
  "c.status === 'DELETED_STATUS'"
);

f = f.replace(
  /\['Pending', 'Scheduled'\]/g,
  "['Scheduled']"
);

// Fallbacks
f = f.replace(/STATUS\.Pending/g, 'STATUS.Scheduled');

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed Pending in Consultations.jsx');
