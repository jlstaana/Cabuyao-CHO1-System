const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const summaryFunc = `
function formatScheduleSummary(availability) {
  if (!availability?.length) return 'Available without fixed schedule';
  const groups = {};
  availability.forEach(slot => {
    let t = \`\${slot.start_time.substring(0, 5)} - \${slot.end_time.substring(0, 5)}\`;
    if (!groups[t]) groups[t] = [];
    groups[t].push(slot.day_of_week.substring(0, 3));
  });

  const parts = Object.entries(groups).map(([time, days]) => {
    let dayStr = days.join(', ');
    if (days.length === 7) dayStr = 'Everyday';
    else if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) dayStr = 'Weekdays';
    else if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) dayStr = 'Weekends';

    const [start, end] = time.split(' - ');
    return \`\${dayStr} \${formatTime12h(start)} - \${formatTime12h(end)}\`;
  });
  return parts.join(' | ');
}
`;

f = f.replace(/function timeRangeLabel\(start, end\) \{[\s\S]*?\n\}/, (match) => match + "\n" + summaryFunc);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Added formatScheduleSummary');
