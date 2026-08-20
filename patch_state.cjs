const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace('const [doctors, setDoctors]     = useState([]);', 'const [doctors, setDoctors]     = useState([]);\n  const [medicalImages, setMedicalImages] = useState([]);');

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed state');
