const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// 1. Fix unicode corrupted characters
file = file.replace(/A\uFFFD/g, " | ");
file = file.replace(/A\u00C2\u00A0/g, " | ");
file = file.replace(/\u00B7/g, " | ");

// 2. DoctorView variables fix
file = file.replace(/const pending\s*=\s*consultations\.filter\(c => c\.status === 'Pending'\);/, "const scheduled = consultations.filter(c => c.status === 'Scheduled');");
file = file.replace(/const scheduled\s*=\s*consultations\.filter\(c => c\.status === 'Scheduled'\);/, "const completed = consultations.filter(c => c.status === 'Completed');");
file = file.replace(/const completed\s*=\s*consultations\.filter\(c => c\.status === 'Completed'\);/, "const cancelled = consultations.filter(c => c.status === 'Cancelled' || c.status === 'Missed');");

file = file.replace(/const counts = \{ Pending: pending\.length, Scheduled: scheduled\.length, Completed: completed\.length \};/, "const counts = { Scheduled: scheduled.length, Completed: completed.length, Cancelled: cancelled.length };");
file = file.replace(/const baseFiltered = tab === 'Pending' \? pending : tab === 'Scheduled' \? scheduled : completed;/, "const baseFiltered = tab === 'Scheduled' ? scheduled : tab === 'Completed' ? completed : cancelled;");

// 3. DoctorView stat cards block
const docCardsOld = `{[
          { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          ].map(s => (`;
const docCardsNew = `{[
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
          { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
        ].map(s => (`
file = file.replace(docCardsOld, docCardsNew);

// 4. DoctorView empty state text
file = file.replace(/\{tab === 'Pending' \? 'No pending request\.' : `No \$\{tab\.toLowerCase\(\)\} consultations\.`\}/g, "`No \\${tab.toLowerCase()} consultations.`");

// 5. DoctorView Scheduled/Preferred text
file = file.replace(/\{c\.status === 'Pending' \? 'Preferred' : 'Scheduled'\}/g, "'Scheduled'");

// 6. DoctorView tabs array
file = file.replace(/\{\['Pending',\s*'Scheduled',\s*'Completed'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

// 7. DoctorView tabs badge logic
const badgeLogic = `{counts[t] > 0 && t === 'Pending' && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-surface">
                    {counts[t]}
                  </span>
                )}`;
file = file.replace(badgeLogic, "");

// 8. DoctorView accept button block
const acceptBtnBlock = `{c.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => onAccept(c)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-success-bg text-success-text rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-3 py-2 bg-surface text-text-muted border border-border rounded-xl text-sm font-semibold hover:border-sky-300 hover:text-sky-600 transition-colors">
                      <Calendar size={16} /> Reschedule
                    </button>
                    <button onClick={() => onCancel(c)} className="px-3 py-2 bg-surface text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}`;
file = file.replace(acceptBtnBlock, "");

// 9. AdminView Tabs & Search
file = file.replace(/\{\s*status:\s*'Pending',\s*sub:\s*'Awaiting assignment'\s*\},/g, "");
file = file.replace(/\{\['Pending','Scheduled','Completed','Cancelled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");
// Just in case it was different:
file = file.replace(/\{\['Pending','Scheduled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

// 10. AdminView Stat Cards Grid
file = file.replace(/<div data-tour="page-stats" className="grid grid-cols-2 gap-3">/, '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">');

// 11. AdminView Stat Cards Array
const adminCardsOld = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          
          
        ].map(s => (`
const adminCardsNew = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Finished sessions' },
          { status: 'Cancelled', sub: 'Discontinued' },
        ].map(s => (`
file = file.replace(adminCardsOld, adminCardsNew);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Safe patch applied');
