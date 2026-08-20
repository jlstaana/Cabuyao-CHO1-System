const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const regex = /api\.get\('\/admin\/users'\)[\s\S]*?\.catch\(console\.error\);\s*\}/;

const fetchCode = `      if (user?.role === 'Patient') {
        api.get('/medical-images')
          .then(res => { if (isActive) setMedicalImages(res.data); })
          .catch(console.error);
      }`;

file = file.replace(regex, `$&
${fetchCode}`);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed fetch');
