const fs = require('fs');
let modal = fs.readFileSync('modal.txt', 'utf-8');

// Replace maxWidth
modal = modal.replace(
  '<Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Teleconsultation">',
  '<Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Teleconsultation" maxWidth="max-w-6xl">'
);

// Split form into 2 columns
modal = modal.replace(
  '<form data-tour="page-form" onSubmit={handleRequestSubmit} className="space-y-4">',
  '<form data-tour="page-form" onSubmit={handleRequestSubmit}>\n<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">\n<div className="lg:col-span-4 space-y-4">\n'
);

// Close left column and open right column right before the "Selected Appointment Slot" div
const rightColSplit = /<div>\s*<label className="block text-sm font-medium text-text-muted mb-1">Selected Appointment Slot<\/label>/;
modal = modal.replace(rightColSplit, '</div>\n<div className="lg:col-span-8 space-y-4">\n$&');

// Close right column and grid before the submit buttons
const submitButtons = /<div className="pt-2 flex justify-end gap-3">/;
modal = modal.replace(submitButtons, '</div>\n</div>\n$&');

// Inside the grid, let's change the 7-day layout to adapt to the new width!
// Currently it's `grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7`
// Since it's inside `lg:col-span-8`, `lg:grid-cols-7` might be a bit cramped, but `max-w-6xl` is 1152px. 
// 8/12 of 1152px is ~768px. 7 columns in 768px is ~100px per column. It should fit!

fs.writeFileSync('new_modal.txt', modal);
console.log('Modified modal written to new_modal.txt');
