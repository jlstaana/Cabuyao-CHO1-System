const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

file = file.replace(/function doctorSlotStatus\(doctor, date, slot\) \{[\s\S]*?return \{ count, isFull.*?\};\n  \}/, `function doctorSlotStatus(doctor, date, slot) {
    try {
      const booked = (doctor.booked_slots || []).find((booked) => (
        booked && slot &&
        booked.date === dateKey(date)
        && booked.day_of_week === slot.day_of_week
        && String(booked.start_time || '').startsWith(String(slot.start_time || '').slice(0, 5))
      ));
      const capacity = doctor.slot_capacity || 18;
      const count = booked ? booked.count : 0;
      return { count, isFull: count >= capacity, remaining: Math.max(0, capacity - count) };
    } catch (e) {
      console.error('doctorSlotStatus error', e);
      return { count: 0, isFull: false, remaining: 18 };
    }
  }`);
  
file = file.replace(/function getDoctorSlotsForDate\(doctor, date\) \{[\s\S]*?return baseSlots.*?\;\n  \}/, `function getDoctorSlotsForDate(doctor, date) {
    try {
      if (!doctor || !date) return [];
      const dateStr = dateKey(date);
      let baseSlots = (doctor.availability || []).filter((slot) => slot && slot.day_of_week === dayName(date));
      
      const exceptions = (doctor.exceptions || []).filter(e => e && e.date === dateStr);
      const leaves = exceptions.filter(e => e.type === 'leave');
      if (leaves.length > 0) {
        if (leaves.some(l => !l.start_time)) {
          baseSlots = [];
        } else {
          leaves.forEach(leave => {
            baseSlots = baseSlots.filter(s => {
              if (!s || !leave) return false;
              return !(s.start_time >= leave.start_time && s.start_time < (leave.end_time || '23:59:59'));
            });
          });
        }
      }
    
      const extraSlots = exceptions.filter(e => e.type === 'extra_slot');
      extraSlots.forEach(extra => {
        if (extra && extra.start_time) {
          baseSlots.push({ start_time: extra.start_time, end_time: extra.end_time || extra.start_time, is_extra: true, day_of_week: dayName(date) });
        }
      });
    
      return baseSlots.sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
    } catch (e) {
      console.error('getDoctorSlotsForDate error', e);
      return [];
    }
  }`);
  
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched');
