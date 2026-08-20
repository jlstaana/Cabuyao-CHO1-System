const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');
file = file.replace('$<0>', '<div className="pt-2 flex justify-end gap-3">\\n              <button type="button" onClick={() => setAvailabilityModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>');
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed $<0>');
