const fs = require('fs');
const file = 'src/pages/dashboard/TeleconsultationRoom.jsx';
let content = fs.readFileSync(file, 'utf8');

// replace \` with `
content = content.replace(/\\`/g, '`');
// replace \${ with ${
content = content.replace(/\\\${/g, '${');

fs.writeFileSync(file, content);
console.log('Fixed syntax escapes');
