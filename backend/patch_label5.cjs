const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const startIdx = file.indexOf('function availabilityLabel(availability)');
const endIdx = file.indexOf('function dateKey');

const before = file.substring(0, startIdx);
const after = file.substring(endIdx);

const newLabelFn = `function availabilityLabel(availability) {
  if (!availability || availability.length === 0) {
    return 'Available without fixed schedule';
  }

  const grouped = {};
  availability.forEach(slot => {
    if (!slot) return;
    const time = \`\${String(slot.start_time || '').slice(0, 5)}-\${String(slot.end_time || '').slice(0, 5)}\`;
    if (!grouped[time]) grouped[time] = [];
    grouped[time].push(String(slot.day_of_week || '').slice(0, 3));
  });

  return Object.entries(grouped).map(([time, daysArray]) => {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    daysArray.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    const uniqueDays = [...new Set(daysArray)];
    let dayStr = uniqueDays.join(', ');
    
    if (uniqueDays.length === 7) {
      dayStr = 'Everyday';
    } else if (uniqueDays.length === 5 && uniqueDays[0] === 'Mon' && uniqueDays[4] === 'Fri') {
      dayStr = 'Mon-Fri';
    } else if (uniqueDays.length === 2 && uniqueDays.includes('Sat') && uniqueDays.includes('Sun')) {
      dayStr = 'Weekends';
    }
    return \`\${dayStr} (\${time})\`;
  }).join('  •  ');
}

`;

file = before + newLabelFn + after;

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched label 5');
