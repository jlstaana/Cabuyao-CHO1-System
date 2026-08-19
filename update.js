const fs = require('fs');
const file = 'frontend/src/pages/dashboard/Consultations.jsx';
let code = fs.readFileSync(file, 'utf8');

// Add getDisplayStatus
if (!code.includes('const getDisplayStatus')) {
  code = code.replace('function StatusPill({ status }) {', `const getDisplayStatus = (c) => {
  if (c.status === 'Scheduled' && c.scheduled_at) {
    const scheduledTime = new Date(c.scheduled_at).getTime();
    const now = new Date().getTime();
    if (now > scheduledTime + 15 * 60 * 1000) return 'Missed';
  }
  return c.status;
};

function StatusPill({ status }) {`);
}

// Add Missed to STATUS
if (!code.includes('Missed:')) {
  code = code.replace(
    /Cancelled:\s*\{[^}]+\},/,
    "Cancelled: { pill: 'bg-slate-50 text-text-muted border-slate-200 border shadow-sm',   dot: 'bg-slate-400',   icon: XCircle },\n  Missed:    { pill: 'bg-rose-50 text-rose-700 border-rose-200 border shadow-sm',       dot: 'bg-rose-500',    icon: AlertCircle },"
  );
}

// Ensure AlertCircle is imported
if (!code.includes('AlertCircle')) {
  code = code.replace(/Calendar(,| })/, 'Calendar, AlertCircle$1');
}

// Replace StatusPill status={c.status} with StatusPill status={getDisplayStatus(c)}
// Note: we might have multiple c.status, or selected.status
code = code.replace(/<StatusPill status=\{c\.status\} \/>/g, '<StatusPill status={getDisplayStatus(c)} />');
code = code.replace(/<StatusPill status=\{selected\.status\} \/>/g, '<StatusPill status={getDisplayStatus(selected)} />');

fs.writeFileSync(file, code);
console.log("Updated Consultations.jsx");
