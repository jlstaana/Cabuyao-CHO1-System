const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const oldLabelFn = `function availabilityLabel(availability) {
  if (!availability || availability.length === 0) {
    return 'Available without fixed schedule';
  }

  return availability
    .filter(slot => slot != null)
    .map((slot) => \`\${String(slot.day_of_week || '').slice(0, 3)} \${timeRangeLabel(slot)}\`)
    .join(', ');
}`;

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
    let dayStr = daysArray.join(', ');
    if (daysArray.length === 7) dayStr = 'Everyday';
    else if (daysArray.length === 5 && daysArray[0] === 'Mon' && daysArray[4] === 'Fri' && !daysArray.includes('Sat') && !daysArray.includes('Sun')) dayStr = 'Mon-Fri';
    else if (daysArray.length === 2 && daysArray.includes('Sat') && daysArray.includes('Sun')) dayStr = 'Weekends';
    return \`\${dayStr} (\${time})\`;
  }).join('  •  ');
}`;

file = file.replace(oldLabelFn, newLabelFn);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched label 2');
