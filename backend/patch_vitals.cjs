const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

// 1. Remove vitals from tab array
file = file.replace(/\{\s*key:\s*'vitals',\s*label:\s*'Vital Signs',\s*icon:\s*HeartPulse\s*\},\s*/g, "");

// 2. Remove "View Vitals" button
const btnRegex = /<button[\s\S]*?onClick=\{\(\) => setTab\(patient\.id, 'vitals'\)\}[\s\S]*?<\/button>/g;
file = file.replace(btnRegex, "");

// 3. Remove Vitals tab content
const startIdx = file.indexOf("{/* \u2728 Vitals tab"); // Wait, it's weird corrupted text in terminal.
// Let's use standard string searching.
const vTabStr1 = "{/*";
const vTabStr2 = "Vitals tab";
const imagesTabStr2 = "Images tab";

const vStart = file.lastIndexOf("{/*", file.indexOf("Vitals tab"));
const iStart = file.lastIndexOf("{/*", file.indexOf("Images tab"));

if (vStart !== -1 && iStart !== -1 && iStart > vStart) {
  file = file.substring(0, vStart) + file.substring(iStart);
}

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', file);
console.log('Removed vitals tab');
