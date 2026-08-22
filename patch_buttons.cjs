const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/disabled=\{isFull\}/g, 'disabled={!slot.isAvailable || isFull}');

file = file.replace(
  /isFull\s*\?\s*'bg-danger-bg text-rose-400 line-through'\s*:\s*isSelectedSlot/g,
  "!slot.isAvailable ? 'bg-surface/50 text-text-muted/30 cursor-not-allowed border border-border' : isFull ? 'bg-danger-bg text-rose-400 line-through' : isSelectedSlot"
);

// We need to fix the inner text of the button
file = file.replace(
  /\{timeRangeLabel\(slot\)\} [^\{]+ \{isFull \? 'Full' : `\$\{slotStatus\.remaining\} left`\}/g,
  "{timeRangeLabel(slot)} · {!slot.isAvailable ? 'Unavailable' : isFull ? 'Full' : `${slotStatus.remaining} left`}"
);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched buttons');
