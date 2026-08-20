const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');
const newModal = fs.readFileSync('new_modal.txt', 'utf-8');

const regex = /\{\/\* Patient Request Modal \*\/\}[\s\S]*?<\/Modal>/;
file = file.replace(regex, newModal);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Applied new modal');
