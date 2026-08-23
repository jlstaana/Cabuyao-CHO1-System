const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', 'utf-8');

file = file.replace(/Upload New Image/g, 'Upload New File');
file = file.replace(/Drag &amp; drop images here/g, 'Drag &amp; drop files here');
file = file.replace(/Image Type/g, 'Document Type');
file = file.replace(/Uploaded images are securely stored in your personal medical gallery/g, 'Uploaded files are securely stored in your personal medical record');
file = file.replace(/My Uploaded Images/g, 'My Uploaded Files');
file = file.replace(/No images uploaded yet/g, 'No files uploaded yet');
file = file.replace(/Please select at least one image/g, 'Please select at least one file');
file = file.replace(/image\(s\) uploaded successfully/g, 'file(s) uploaded successfully');

fs.writeFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', file);
console.log('Patched strings');
