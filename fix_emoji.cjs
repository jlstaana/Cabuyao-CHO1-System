const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

// The line is: {t === 'visiting' ? 'ðŸ©º Visiting Doctor' : 'ðŸ ¥'?? Permanent'}
// Let's just regex replace that exact line
file = file.replace(/\{t === 'visiting' \? '([^']+)' : '([^']+)'\?\? Permanent'\}/g, "{t === 'visiting' ? '?? Visiting Doctor' : '?? Permanent'}");
// If it's corrupted differently:
file = file.replace(/{t === 'visiting' \? '.*?' : '.*?'}/g, "{t === 'visiting' ? '?? Visiting Doctor' : '?? Permanent'}");

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Fixed emoji');
