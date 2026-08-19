const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', 'utf-8');
content = content.replace('domain="meet.jit.si"', 'domain="meet.ffmuc.net"');
fs.writeFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', content);
console.log('Domain updated');
