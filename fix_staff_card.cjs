const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', 'utf-8');

// The card starts with <div className="p-4 rounded-2xl ... from-amber-500 to-amber-600 ... ">
// And contains "Staff" and "staffCount"
file = file.replace(/<div[^>]*from-amber-500 to-amber-600[^>]*>[\s\S]*?Health officers & staff[\s\S]*?<\/p>\s*<\/div>/, '');

// AND we need to delete `staffCount` declaration! Wait, we already deleted the staffCount declaration!
// Wait! If the staffCount declaration is GONE but the JSX is STILL THERE, it will crash with `staffCount is not defined`!
// That's exactly why the page turns white!

fs.writeFileSync('frontend/src/pages/dashboard/ManageUsers.jsx', file);
console.log('Fixed Staff Card');
