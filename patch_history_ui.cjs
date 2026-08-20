const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/ConsultationHistory.jsx', 'utf-8');

file = file.replace(
  '<p className="font-bold text-text truncate max-w-[200px]">{item.doctor}</p>',
  '<p className="font-bold text-text truncate max-w-[200px]">{user?.role === "Doctor" ? item.patient : item.doctor}</p>'
);

file = file.replace(
  '<p className="text-xs text-text-light truncate mt-0.5">{item.specialization}</p>',
  '<p className="text-xs text-text-light truncate mt-0.5">{user?.role === "Doctor" ? "Patient" : item.specialization}</p>'
);

fs.writeFileSync('frontend/src/pages/dashboard/ConsultationHistory.jsx', file);
console.log('Fixed history UI');
