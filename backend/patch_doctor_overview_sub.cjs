const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Overview.jsx', 'utf-8');

const oldSub = `sub={\`As of \${new Date().toLocaleString('default', { month: 'long' })}\`}`;
const newSub = `sub={<>As of <b>{new Date().toLocaleString('default', { month: 'long' })}</b></>}`;

f = f.replace(oldSub, newSub);

fs.writeFileSync('../frontend/src/pages/dashboard/Overview.jsx', f);
console.log('Fixed Doctor overview sub label formatting');
