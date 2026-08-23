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

// Insert the function after formatTime12h block
f = f.replace(/function timeRangeLabel\(start, end\) \{\r?\n  return \`\\\$\{formatTime12h\(start\)\} - \\\$\{formatTime12h\(end\)\}\`;\r?\n\}/, `function timeRangeLabel(start, end) {\n  return \`\${formatTime12h(start)} - \${formatTime12h(end)}\`;\n}\n\${summaryFunc}`);

// Replace the inline logic
const oldLogic = `    scheduleLabel: currentDoctorStatus.availability?.length
        ? currentDoctorStatus.availability.map((slot) => \`\${slot.day_of_week.slice(0, 3)} \${slot.start_time}-\${slot.end_time}\`).join(', ')
        : 'Available without fixed schedule',`.replace(/\r\n/g, '\n');
const newLogic = `    scheduleLabel: formatScheduleSummary(currentDoctorStatus.availability),`.replace(/\r\n/g, '\n');

f = f.replace(new RegExp(oldLogic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), newLogic);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Patched schedule summary');
