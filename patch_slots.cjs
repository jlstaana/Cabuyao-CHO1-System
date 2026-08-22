const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const replacement = `
function getDoctorSlotsForDate(doctor, date) {
  if (!doctor) return [];
  const dateStr = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`;
  const day = dayName(date);

  const exceptions = (doctor.exceptions || []).filter(e => e.date === dateStr);
  const leaves = exceptions.filter(e => e.type === 'leave');
  const extraSlots = exceptions.filter(e => e.type === 'extra_slot');

  const avail = (doctor.availability || []).filter(slot => slot.day_of_week === day);

  // Generate 24 hourly slots (DFA standard viewing)
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const start = String(i).padStart(2, '0') + ':00';
    const end = String(i + 1).padStart(2, '0') + ':00';
    
    // Check if this hour is covered by availability or an extra_slot exception
    let isCovered = avail.some(a => start >= String(a.start_time).slice(0, 5) && start < String(a.end_time).slice(0, 5));
    if (!isCovered) {
      isCovered = extraSlots.some(e => start >= String(e.start_time).slice(0, 5) && start < String(e.end_time).slice(0, 5));
    }

    // Check if this hour is blocked by a leave
    if (leaves.length > 0) {
      if (leaves.some(l => !l.start_time)) {
        isCovered = false; // Whole day leave
      } else {
        if (leaves.some(l => start >= String(l.start_time).slice(0, 5) && start < String(l.end_time).slice(0, 5))) {
          isCovered = false;
        }
      }
    }

    // Determine the original block that covers this (for quota tracking)
    let parentBlock = null;
    if (isCovered) {
      parentBlock = avail.find(a => start >= String(a.start_time).slice(0, 5) && start < String(a.end_time).slice(0, 5));
      if (!parentBlock) {
        parentBlock = extraSlots.find(e => start >= String(e.start_time).slice(0, 5) && start < String(e.end_time).slice(0, 5));
      }
    }

    slots.push({
      start_time: start,
      end_time: end === '24:00' ? '23:59' : end,
      isAvailable: isCovered,
      parentBlock
    });
  }

  return slots;
}
`;

const regex = /function getDoctorSlotsForDate\(doctor, date\) \{[\s\S]*?return baseSlots\.sort\(\(a, b\) => String\(a\.start_time\)\.localeCompare\(String\(b\.start_time\)\)\);\s*\}/;

if (file.match(regex)) {
  file = file.replace(regex, replacement);
  fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
  console.log('Patched slots');
} else {
  console.log('Failed to patch slots');
}
