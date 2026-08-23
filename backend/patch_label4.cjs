const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const oldPart = "function availabilityLabel(availability) {\n  if (!availability || availability.length === 0) {\n    return 'Available without fixed schedule';\n  }\n\n  return availability\n    .filter(slot => slot != null)\n    .map((slot) => `${String(slot.day_of_week || '').slice(0, 3)} ${timeRangeLabel(slot)}`)\n    .join(', ');\n}";

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
    let dayStr = [...new Set(daysArray)].join(', ');
    const uniqueDays = [...new Set(daysArray)];
    if (uniqueDays.length === 7) dayStr = 'Everyday';
    else if (uniqueDays.length === 5 && uniqueDays[0] === 'Mon' && uniqueDays[4] === 'Fri' && !uniqueDays.includes('Sat') && !uniqueDays.includes('Sun')) dayStr = 'Mon-Fri';
    else if (uniqueDays.length === 2 && uniqueDays.includes('Sat') && uniqueDays.includes('Sun')) dayStr = 'Weekends';
    return \`\${dayStr} (\${time})\`;
  }).join('  •  ');
}`;

// Attempt regex again, much broader
file = file.replace(/function availabilityLabel\(availability\) \{[\s\S]*?\.join\(\', \'\);\n\}/, newLabelFn);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched label 4');
