const fs = require('fs');
let content = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

const endPattern = /  \);\r?\n}/;
let truncatePos = -1;
let length = 0;

let m;
const re = new RegExp(endPattern.source, 'g');
while ((m = re.exec(content)) !== null) {
  truncatePos = m.index;
  length = m[0].length;
}

if (truncatePos !== -1) {
  content = content.slice(0, truncatePos + length) + '\n';
  fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', content);
  console.log('Stripped everything after the component end!');
} else {
  console.log('Could not find component end!');
}
