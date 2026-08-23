const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// 1. Remove Completed/Cancelled tabs
file = file.replace(/const tabs = \['All', 'Pending', 'Scheduled', 'Completed'\];/, "const tabs = ['Scheduled'];");
file = file.replace(/const \[tab, setTab\] = useState\('All'\);/, "const [tab, setTab] = useState('Scheduled');");
file = file.replace(/\{\s*label:\s*'Completed',\s*status:\s*'Completed',\s*count:\s*completed\.length,\s*sub:\s*'Finished'\s*\},\s*/g, "");
file = file.replace(/\{?\['Scheduled', 'Completed'\]\.map\(t => \{/g, "{['Scheduled'].map(t => {");
file = file.replace(/\{\s*status:\s*'Completed',\s*sub:\s*'Successfully finished'\s*\},/g, "");
file = file.replace(/\{\s*status:\s*'Cancelled',\s*sub:\s*'Discontinued requests'\s*\}/g, "");
file = file.replace(/\{?\['Pending','Scheduled','Completed','Cancelled'\]\.map\(t => \{/g, "{['Pending','Scheduled'].map(t => {");
file = file.replace(/const \[tab, setTab\] = useState\('Pending'\);/g, "const [tab, setTab] = useState('Scheduled');");

// 2. Fix Grid columns
file = file.replace(
  /<div data-tour="page-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">/,
  '<div data-tour="page-stats" className="grid grid-cols-2 gap-3">'
);
file = file.replace(
  /<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-3">/,
  '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-1 gap-3">'
);

// 3. New Helper functions (AM/PM + Grouping)
const startIdx = file.indexOf('function dateKey');
const beforeHelpers = file.substring(0, startIdx);
const afterHelpers = file.substring(startIdx);

// We need to cut out the old functions from beforeHelpers
const oldTimeStart = beforeHelpers.indexOf('function timeRangeLabel');
const cleanBefore = beforeHelpers.substring(0, oldTimeStart);

const newHelpers = `function formatTime12h(timeStr) {
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

function availabilityLabel(availability) {
  if (!availability || availability.length === 0) {
    return 'Available without fixed schedule';
  }

  const grouped = {};
  availability.forEach(slot => {
    if (!slot) return;
    const time = timeRangeLabel(slot);
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
  }).join(' | ');
}

`;

file = cleanBefore + newHelpers + afterHelpers;

// 4. Current Doctor Top Card Label Fix
const doctorRegex = /scheduleLabel: currentDoctorStatus\.availability\?\.length[\s\S]*?\?\scurrentDoctorStatus\.availability\.map[^\n]+\.join\(\', \'\)[\s\S]*?\:\s'Available without fixed schedule',/;
file = file.replace(doctorRegex, "scheduleLabel: availabilityLabel(currentDoctorStatus.availability),");

// 5. Corrupt UTF-8 characters
file = file.replace(/·/g, " | ");
// and just in case it's literally A + \uFFFD (which happens in powershell)
file = file.replace(/A\uFFFD/g, " | ");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Applied all patches successfully!');
