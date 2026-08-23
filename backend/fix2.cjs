const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

// The file should end at `  }\n` (the end of Analytics function)
const marker = '      </div>\n    );\n  }';
const correctEndIndex = f.indexOf(marker);

if (correctEndIndex !== -1) {
  // Truncate the file at this marker + length of marker
  f = f.slice(0, correctEndIndex + marker.length) + '\n';
  fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
  console.log('Truncated properly');
} else {
  console.log('Marker not found!');
}
