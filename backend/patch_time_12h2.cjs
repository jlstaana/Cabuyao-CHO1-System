const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const regex = /function timeRangeLabel\(slot\) \{[\s\S]*?\}\n/;

const newTimeRangeLabel = `function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return \`\${hour12}:\${m || '00'} \${ampm}\`;
}

function timeRangeLabel(slot) {
  if (!slot) return '';
  const start = String(slot.start_time || '').slice(0, 5);
  let end = String(slot.end_time || '').slice(0, 5);
  if (end === '23:59' || end === '24:00') end = '00:00';
  return \`\${formatTime12h(start)} - \${formatTime12h(end)}\`;
}
`;

file = file.replace(regex, newTimeRangeLabel);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched timeRangeLabel 2');
