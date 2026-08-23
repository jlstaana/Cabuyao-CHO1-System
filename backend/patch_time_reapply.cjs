const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// 1. Add formatTime12h
const importsBlock = `import { STATUS_COLORS } from '../../components/ConsultationCalendar';`;
const newImports = `import { STATUS_COLORS } from '../../components/ConsultationCalendar';

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return \`\${displayHours}:\${m} \${ampm}\`;
}

function timeRangeLabel(start, end) {
  return \`\${formatTime12h(start)} - \${formatTime12h(end)}\`;
}`;

f = f.replace(importsBlock, newImports);

// 2. Fix the slot mapping in Doctor/Patient view
f = f.replace(/\{slot\.start_time\.substring\(0, 5\)\} - \{slot\.end_time\.substring\(0, 5\)\}/g, "{timeRangeLabel(slot.start_time, slot.end_time)}");
f = f.replace(/\{a\.start_time\.substring\(0, 5\)\} - \{a\.end_time\.substring\(0, 5\)\}/g, "{timeRangeLabel(a.start_time, a.end_time)}");

// 3. Fix Patient tabs
f = f.replace(/const tabs = \['All', 'Pending', 'Scheduled', 'Completed'\];/g, "const tabs = ['Scheduled'];\n  const [tab, setTab] = useState('Scheduled');");
f = f.replace(/const \[tab, setTab\] = useState\('All'\);/g, "");

// 4. Update the actual RequestTeleconsult modal's times
f = f.replace(/time === `\$\{a\.start_time\} - \$\{a\.end_time\}`/g, "time === `${a.start_time} - ${a.end_time}`");
// Wait, the state holds the raw string `start - end`, but the UI renders `timeRangeLabel`.
f = f.replace(/>\{a\.start_time\.substring\(0, 5\)\} - \{a\.end_time\.substring\(0, 5\)\}<\/span>/g, ">{timeRangeLabel(a.start_time, a.end_time)}</span>");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Re-applied formatTime12h and Patient tabs');
