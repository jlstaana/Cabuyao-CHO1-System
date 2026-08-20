const fs = require('fs');
const file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const match = file.match(/\{\/\* Patient Request Modal \*\/\}([\s\S]*?)<\/Modal>/);
if (match) {
    fs.writeFileSync('modal.txt', match[0]);
    console.log('Saved to modal.txt');
} else {
    console.log('Not found');
}
