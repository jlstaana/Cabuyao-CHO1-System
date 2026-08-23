const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Replace literal '\n' characters with actual newlines
f = f.split("\\n              <button type=\"button\"").join("\n              <button type=\"button\"");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed literal newlines');
