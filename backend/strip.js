const fs = require('fs');
let content = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

const expectedEndStr = "  );\n}";
const expectedEndStr2 = "    </div>\n  );\n}";
const expectedEndStr3 = "    </div>\r\n  );\r\n}";

let truncatePos = content.lastIndexOf(expectedEndStr2);
if (truncatePos === -1) truncatePos = content.lastIndexOf(expectedEndStr3);
if (truncatePos === -1) truncatePos = content.lastIndexOf(expectedEndStr);
if (truncatePos !== -1) {
  content = content.slice(0, truncatePos + expectedEndStr2.length) + '\n';
  fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', content);
  console.log('Stripped everything after the component end!');
} else {
  console.log('Could not find component end!');
}
