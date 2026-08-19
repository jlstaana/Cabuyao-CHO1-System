const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', 'utf-8');
content = content.replace('domain="meet.ffmuc.net"', 'domain="jitsi.riot.im"');
fs.writeFileSync('frontend/src/pages/dashboard/TeleconsultationRoom.jsx', content);
console.log('Domain updated');
