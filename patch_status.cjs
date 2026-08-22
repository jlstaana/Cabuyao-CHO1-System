const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const replacement = `
function doctorSlotStatus(doctor, date, slot) {
  const checkStart = slot.parentBlock ? String(slot.parentBlock.start_time).slice(0, 5) : String(slot.start_time).slice(0, 5);
  const checkEnd = slot.parentBlock ? String(slot.parentBlock.end_time).slice(0, 5) : String(slot.end_time).slice(0, 5);
  const day = dayName(date);

  const booked = (doctor.booked_slots || []).find((booked) => (
    booked.date === dateKey(date)
    && booked.day_of_week === day
    && String(booked.start_time).slice(0, 5) === checkStart
    && String(booked.end_time).slice(0, 5) === checkEnd
  ));

  const capacity = booked?.capacity || doctor.slot_capacity || 18;
  const bookedCount = booked?.booked_count || 0;
  const remaining = Math.max((booked?.remaining ?? (capacity - bookedCount)), 0);

  return {
    capacity,
    bookedCount,
    remaining,
    isFull: Boolean(booked?.is_full) || remaining <= 0,
  };
}
`;

const regex = /function doctorSlotStatus\(doctor, date, slot\) \{[\s\S]*?return \{\s*capacity,\s*bookedCount,\s*remaining,\s*isFull: Boolean\(booked\?\.is_full\) \|\| remaining <= 0,\s*\};\s*\}/;

if (file.match(regex)) {
  file = file.replace(regex, replacement);
  fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
  console.log('Patched doctorSlotStatus');
} else {
  console.log('Failed to patch doctorSlotStatus');
}
