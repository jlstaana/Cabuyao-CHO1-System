const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

const target = "wrap(`\n        ${miniHeader('Epidemiology & Pharmacy Report')}\n        ${sectionHeader('Population Health Summary', '#8b5cf6')}\n        ${epiKpiGrid}";

if (!f.includes(target)) {
  f = f.replace(/wrap\(\`\n\s*\$\{miniHeader\('Epidemiology & Pharmacy Report'\)\}/, target);
  fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
  console.log('Fixed page 3 wrapper');
} else {
  console.log('Page 3 wrapper already correct');
}
