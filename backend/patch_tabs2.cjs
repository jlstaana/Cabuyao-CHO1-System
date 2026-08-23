const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Patient tabs
file = file.replace(/const tabs = \['All', 'Pending', 'Scheduled', 'Completed'\];/, "const tabs = ['Pending', 'Scheduled'];");
// Patient default tab
file = file.replace(/const \[tab, setTab\] = useState\('All'\);/, "const [tab, setTab] = useState('Scheduled');");

// Doctor View - stats strip
file = file.replace(
  /\{\s*label:\s*'Completed',\s*status:\s*'Completed',\s*count:\s*completed\.length,\s*sub:\s*'Finished'\s*\},\s*/g,
  ""
);
// Doctor View - tabs strip
file = file.replace(/\{?\['Scheduled', 'Completed'\]\.map\(t => \{/g, "{['Scheduled'].map(t => {");

// Admin view - stats strip
file = file.replace(
  /\{\s*status:\s*'Completed',\s*sub:\s*'Successfully finished'\s*\},/g,
  ""
);
file = file.replace(
  /\{\s*status:\s*'Cancelled',\s*sub:\s*'Discontinued requests'\s*\}/g,
  ""
);
// Admin view - tabs strip
file = file.replace(
  /\{?\['Pending','Scheduled','Completed','Cancelled'\]\.map\(t => \{/g,
  "{['Pending','Scheduled'].map(t => {"
);

// Admin view default tab
file = file.replace(
  /const \[tab, setTab\] = useState\('Pending'\);/g,
  "const [tab, setTab] = useState('Scheduled');" // change default for all
);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched tabs 2');
