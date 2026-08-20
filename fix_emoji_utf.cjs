const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

file = file.replace(/\{t === 'visiting' \? '.*?' : '.*?'\}/g, "{t === 'visiting' ? '\\uD83E\\uDE7A Visiting Doctor' : '\\uD83C\\uDFE5 Permanent'}");

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Fixed emoji with UTF');
