const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/function timeRangeLabel[\s\S]*?function dateKey/m, `function timeRangeLabel(slot) {
  if (!slot) return '';
  return \`\${String(slot.start_time || '').slice(0, 5)}-\${String(slot.end_time || '').slice(0, 5)}\`;
}

function availabilityLabel(availability) {
  if (!availability || availability.length === 0) {
    return 'Available without fixed schedule';
  }

  return availability
    .filter(slot => slot != null)
    .map((slot) => \`\${String(slot.day_of_week || '').slice(0, 3)} \${timeRangeLabel(slot)}\`)
    .join(', ');
}

function dateKey`);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched');
