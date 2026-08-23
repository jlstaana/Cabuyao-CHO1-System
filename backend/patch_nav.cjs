const fs = require('fs');
let file = fs.readFileSync('../frontend/src/utils/navigation.js', 'utf-8');

file = file.replace(/ImagePlus/g, "Folder");
file = file.replace(/Medical Images/g, "Medical Documents");

fs.writeFileSync('../frontend/src/utils/navigation.js', file);
console.log('Patched navigation');
