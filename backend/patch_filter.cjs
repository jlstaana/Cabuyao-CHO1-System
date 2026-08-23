const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/slots\.push\(\{\n\s*start_time: start,\n\s*end_time: end === '24:00' \? '23:59' : end,\n\s*isAvailable: isCovered,\n\s*parentBlock\n\s*\}\);\n\s*\}\n\s*return slots;/g, "slots.push({\n        start_time: start,\n        end_time: end === '24:00' ? '23:59' : end,\n        isAvailable: isCovered,\n        parentBlock\n      });\n    }\n\n    return slots.filter(s => s.isAvailable);");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched slots filter');
