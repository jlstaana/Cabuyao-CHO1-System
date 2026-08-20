const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

file = file.replace(/<div[^>]*from-amber-500 to-orange-600[^>]*>[\s\S]*?Health officers & staff[\s\S]*?<\/p>\s*<\/div>/, '');

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Fixed Staff Card for real');
