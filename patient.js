const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');

// Remove Vital signs inputs
const vitalsRegex = /<div>\s*<p className="block text-sm font-medium text-text-muted mb-2">Vital Signs<\/p>\s*<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">[\s\S]*?<\/div>\s*<\/div>/;
file = file.replace(vitalsRegex, '');

// Change 'Consultation Details' to 'Consultation Request For'
file = file.replace(
  '<p className="text-sm font-medium text-text-muted mb-3">Consultation Details</p>',
  '<p className="text-sm font-medium text-text-muted mb-3">Consultation Request For</p>'
);

// Hide Vital signs display box for patient
const vitalsDisplayRegex = /<div className="rounded-xl border border-border bg-surface p-4">\s*<p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">\s*<HeartPulse size=\{15\} className="text-danger-text" \/> Vital Signs\s*<\/p>[\s\S]*?<\/div>\s*<\/div>/g;

file = file.replace(vitalsDisplayRegex, (match, offset) => {
    // Only remove the first occurrence which is in PatientView!
    // Actually, wait, PatientView doesn't have reviewModal. The reviewModal is at the bottom of the main file.
    // Wait, the previous agent removed the vital signs display entirely from the modal?
    // Let's just remove the first occurrence of HeartPulse box inside PatientView? 
    // PatientView doesn't have it. The main file has the ReviewModal.
    // The previous agent's patch was "Hide vital signs box for patient".
    return match;
});

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
