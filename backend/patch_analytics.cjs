const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

file = file.replace(/pending_consultations/g, "cancelled_consultations");
file = file.replace(/Pending \/ Reminders/g, "Cancelled Consultations");
file = file.replace(/Pending to-do items for doctors/g, "Discontinued consultations");

fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', file);
console.log('Analytics patched');
