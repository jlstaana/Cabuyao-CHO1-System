const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', 'utf-8');

// Filter out pending
const oldFormat = `const formattedConsultations = rawConsultations.map(c => ({
      id: c.id,
      date: formatDate(c.scheduled_at || c.created_at),`;
const newFormat = `const formattedConsultations = rawConsultations.filter(c => c.status !== 'Pending').map(c => ({
      id: c.id,
      date: formatDate(c.scheduled_at || c.created_at),`;

f = f.replace(oldFormat, newFormat);

// Fix STATUS_STYLE reference error and fallback
f = f.replace(/STATUS_STYLE/g, 'STATUS_CONFIG');
f = f.replace(/STATUS_CONFIG\[c\.status\] \|\| STATUS_CONFIG\.Pending/g, 'STATUS_CONFIG[c.status] || STATUS_CONFIG.Scheduled');

// Remove Pending from STATUS_CONFIG
const oldConfig = `const STATUS_CONFIG = {
  Completed:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Scheduled:  { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  Pending:    { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Cancelled:  { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};`;

const newConfig = `const STATUS_CONFIG = {
  Completed:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Scheduled:  { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  Cancelled:  { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};`;

f = f.replace(oldConfig, newConfig);

fs.writeFileSync('../frontend/src/pages/dashboard/PatientRecords.jsx', f);
console.log('Fixed pending and reference error in PatientRecords');
