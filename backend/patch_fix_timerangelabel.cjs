const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// The broken code
const broken = `function timeRangeLabel(slot) {
  if (!slot) return '';
  return \`\${formatTime12h(slot.start_time)} - \${formatTime12h(slot.end_time)}\`;
}-\${String(slot.end_time || '').slice(0, 5)}\`;
  }`.replace(/\r\n/g, '\n');

const fixed = `function timeRangeLabel(slot) {
  if (!slot) return '';
  return \`\${formatTime12h(slot.start_time)} - \${formatTime12h(slot.end_time)}\`;
}`;

f = f.replace(new RegExp(broken.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), fixed);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed timeRangeLabel');
