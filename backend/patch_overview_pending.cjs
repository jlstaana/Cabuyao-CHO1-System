const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Overview.jsx', 'utf-8');

const target = `consultations.filter(c => c.status === 'Pending').forEach(c => {
    tasks.push({ id: \`p-\${c.id}\`, text: \`Review pending request from \${c.patient?.user?.name || 'Patient'}\`, type: 'pending', link: '/consultations' });
  });`;

f = f.replace(target, '');

fs.writeFileSync('../frontend/src/pages/dashboard/Overview.jsx', f);
console.log('Fixed Overview.jsx');
