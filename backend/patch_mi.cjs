const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', 'utf-8');

// The PageTitle usually has Medical Images
file = file.replace(/title="Medical Images"/, 'title="Medical Documents"');
file = file.replace(/description="View and upload your medical test results, X-rays, and certificates\."/, 'description="Upload and view your lab results, certificates, and medical records."');
file = file.replace(/ImagePlus/g, 'Folder'); // change icons

fs.writeFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', file);
console.log('Patched MedicalImages.jsx');
