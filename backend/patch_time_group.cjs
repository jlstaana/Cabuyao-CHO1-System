const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/const time = \`\$\{String\(slot\.start_time \|\| \'\'\)\.slice\(0, 5\)\}-\$\{String\(slot\.end_time \|\| \'\'\)\.slice\(0, 5\)\}\`;/g, "const time = timeRangeLabel(slot);");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched group time');
