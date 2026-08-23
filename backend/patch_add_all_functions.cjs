const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const funcs = `
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return \`\${displayHours}:\${m} \${ampm}\`;
}

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

// Insert after the last import
f = f.replace(/import.*?['"];?[\r\n]+(?!import)/, (match) => match + funcs + "\n");

// Fix timeRangeLabel(slot) which is what is in the file
f = f.replace(/function timeRangeLabel\(slot\) \{[\s\S]*?\}/, `function timeRangeLabel(slot) {\n  if (!slot) return '';\n  return \`\${formatTime12h(slot.start_time)} - \${formatTime12h(slot.end_time)}\`;\n}`);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Added functions successfully');
