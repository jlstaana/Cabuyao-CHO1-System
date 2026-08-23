const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Replace corrupted dot
f = f.replace(/doctor A\uFFFD/g, "doctor |");
f = f.replace(/doctor A\u00C2\u00A0/g, "doctor |");
f = f.replace(/doctor \u00B7/g, "doctor |");

// Or just fallback
f = f.replace(/\} doctor A \{/g, "} doctor | {");

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);
console.log('Fixed dot');
