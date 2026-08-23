const fs = require('fs');

// 1. Consultations.jsx
let f = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

f = f.replace(/const pending\s*=\s*consultations\.filter\(c => c\.status === 'Pending'\);/, "const scheduled = consultations.filter(c => c.status === 'Scheduled');");
f = f.replace(/const scheduled\s*=\s*consultations\.filter\(c => c\.status === 'Scheduled'\);/, "const completed = consultations.filter(c => c.status === 'Completed');");
f = f.replace(/const completed\s*=\s*consultations\.filter\(c => c\.status === 'Completed'\);/, "const cancelled = consultations.filter(c => c.status === 'Cancelled' || c.status === 'Missed');");

f = f.replace(/const counts = \{ Pending: pending\.length, Scheduled: scheduled\.length, Completed: completed\.length \};/, "const counts = { Scheduled: scheduled.length, Completed: completed.length, Cancelled: cancelled.length };");
f = f.replace(/const baseFiltered = tab === 'Pending' \? pending : tab === 'Scheduled' \? scheduled : completed;/, "const baseFiltered = tab === 'Scheduled' ? scheduled : tab === 'Completed' ? completed : cancelled;");
f = f.replace(/const \[tab, setTab\] = useState\('Pending'\);/, "const [tab, setTab] = useState('Scheduled');");

const docOldCards = `        {[
          { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          ].map(s => (`.replace(/\r\n/g, "\n");
const docNewCards = `        {[
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
          { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
        ].map(s => (`.replace(/\r\n/g, "\n");
f = f.replace(new RegExp(docOldCards.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), docNewCards);

f = f.replace(/\{\['Pending',\s*'Scheduled',\s*'Completed'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");
f = f.replace(/\{\['Pending',\s*'Scheduled'\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

const badgeLogic = `                {counts[t] > 0 && t === 'Pending' && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{counts[t]}</span>
                )}`.replace(/\r\n/g, "\n");
f = f.replace(new RegExp(badgeLogic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), "");

f = f.replace(/\{tab === 'Pending' \? 'No pending request\.' : `No \$\{tab\.toLowerCase\(\)\} consultations\.`\}/g, "`No \\${tab.toLowerCase()} consultations.`");
f = f.replace(/\{c\.status === 'Pending' \? 'Preferred' : 'Scheduled'\}/g, "'Scheduled'");

const acceptLogic = `                  {c.status === 'Pending' && (
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
                  )}`.replace(/\r\n/g, "\n");
f = f.replace(new RegExp(acceptLogic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), "");

f = f.replace(/\{\s*status:\s*'Pending',\s*sub:\s*'Awaiting assignment'\s*\},/g, "");
f = f.replace(/<div data-tour="page-stats" className="grid grid-cols-2 gap-3">/, '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">');

const adminCardsOld = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          
          
        ].map(s => (`.replace(/\r\n/g, "\n");
const adminCardsNew = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Finished sessions' },
          { status: 'Cancelled', sub: 'Discontinued' },
        ].map(s => (`.replace(/\r\n/g, "\n");
f = f.replace(new RegExp(adminCardsOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), adminCardsNew);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', f);

// 2. Overview.jsx
let o = fs.readFileSync('../frontend/src/pages/dashboard/Overview.jsx', 'utf-8');

// Staff overview Pending StatCard
const staffOldCard = `<StatCard label="Pending Requests" value={pending} icon={Clock} color="text-amber-500"  sub="Needs assignment" />`.replace(/\r\n/g, "\n");
o = o.replace(new RegExp(staffOldCard.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), "");
o = o.replace(/const pending = consultations\.filter\(\(c\) => c\.status === 'Pending'\)\.length;/g, "");

// Doctor overview Pending StatCard
const docOldOverviewCard = `<StatCard label="Patient Queue" value={pending} icon={Clock} color="text-amber-500"  sub="Pending requests needing review" />`.replace(/\r\n/g, "\n");
o = o.replace(new RegExp(docOldOverviewCard.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), "");

// Doctor ToDo List
const docTodoPending = `    consultations.filter(c => c.status === 'Pending').forEach(c => {
      tasks.push({ id: \`p-\${c.id}\`, text: \`Review pending request from \${c.patient?.user?.name || 'Patient'}\`, type: 'pending', link: '/consultations' });
    });`.replace(/\r\n/g, "\n");
o = o.replace(new RegExp(docTodoPending.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), "");

// ConsultationQueue 'Pending' text
o = o.replace(/const rows = consultations\.filter\(\(c\) => \['Pending', 'Scheduled'\]\.includes\(c\.status\)\)\.slice\(0, 5\);/, "const rows = consultations.filter((c) => ['Scheduled'].includes(c.status)).slice(0, 5);");
o = o.replace(/\{rows\.length === 0 \? <p className="text-sm text-text-light">No pending or scheduled consultations\.<\/p> : rows\.map\(\(c\) => \(/, "{rows.length === 0 ? <p className=\"text-sm text-text-light\">No scheduled consultations.</p> : rows.map((c) => (");

fs.writeFileSync('../frontend/src/pages/dashboard/Overview.jsx', o);

console.log('Final patch complete');
