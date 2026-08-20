const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');

// Fix intro text
file = file.replace(
  'Enter your consultation details, vital signs, and preferred schedule. The system will schedule an available doctor or queue the request for coordination.',
  'Enter your consultation details and select your preferred schedule.'
);

// Fix labels
file = file.replace(
  '<label className="block text-sm font-medium text-text-muted mb-1">Consultation Details</label>',
  '<label className="block text-sm font-medium text-text-muted mb-1">Consultation Request For</label>'
);

// Remove the Doctor Availability block
const docAvailRegex = /<div className="rounded-xl border border-border bg-background px-4 py-3">\s*<p className="text-xs font-semibold uppercase text-text-light mb-2">Doctor Availability<\/p>[\s\S]*?<\/div>\s*<\/div>/;
file = file.replace(docAvailRegex, '');

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
