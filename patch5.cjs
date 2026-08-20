const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// The corrupted block starts at <div className="space-y-3 pt-4 border-t border-border"> inside PatientView
// and ends right before {search && (
const corruptStartRegex = /<div className="space-y-3 pt-4 border-t border-border">\s*<div className="flex items-center justify-between gap-3">\s*<div>\s*<p className="text-sm font-semibold text-text-muted">Emergency Leaves & Ad-Hoc Slots<\/p>[\s\S]*?\{\(availabilityForm\.exceptions \|\| \[\]\)\.length === 0 && \([\s\S]*?<\/p>\s*\)\}\s*<\/div>/;

const extractedBlockMatches = file.match(corruptStartRegex);
if (!extractedBlockMatches) {
  console.log('Could not find corrupted block!');
  process.exit(1);
}
const extractedBlock = extractedBlockMatches[0];

// Remove it from PatientView
file = file.replace(extractedBlock, '');

// Insert it back into availabilityModal, right above the Cancel/Save buttons container
const modalButtonsTarget = /<div className="pt-2 flex justify-end gap-3">\s*<button type="button" onClick=\{[\s\S]*?setAvailabilityModal\(false\)[\s\S]*?Cancel<\/button>/;

file = file.replace(modalButtonsTarget, extractedBlock + '\n\n            ' + `$<0>`);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Fixed exception block location!');
