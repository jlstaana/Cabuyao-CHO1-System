const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/\{counts\[t\] > 0 && t === 'Pending' && \([\s\S]*?\}\)/g, "");
file = file.replace(/\{tab === 'Pending' \? 'No pending request\.' : `No \$\{tab\.toLowerCase\(\)\} consultations\.`\}/g, "`No \\${tab.toLowerCase()} consultations.`");
file = file.replace(/\{c\.status === 'Pending' \? 'Preferred' : 'Scheduled'\}/g, "'Scheduled'");

// Replace the Accept button block for Pending
const acceptRegex = /\{c\.status === 'Pending' && \([\s\S]*?<\/button>\s*<\/div>\s*\)\}/;
file = file.replace(acceptRegex, "");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Removed Pending logic');
