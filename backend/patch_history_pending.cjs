const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/ConsultationHistory.jsx', 'utf-8');

file = file.replace(/const FILTERS = \['All', 'Completed', 'Scheduled', 'Pending', 'Cancelled'\];/, "const FILTERS = ['All', 'Completed', 'Scheduled', 'Cancelled'];");

fs.writeFileSync('../frontend/src/pages/dashboard/ConsultationHistory.jsx', file);
console.log('Removed Pending from history');
