const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

file = file.replace(
  '<StatCard label="Completed Consults" value={formatNumber(summary.completed_consultations)} sub="Eligible for prescriptions" color="rose" />',
  '<StatCard label="Active Medicines" value={formatNumber(summary.active_medicines)} sub="Available in inventory" color="rose" />'
);

fs.writeFileSync('frontend/src/pages/dashboard/Analytics.jsx', file);
console.log('Fixed analytics');
