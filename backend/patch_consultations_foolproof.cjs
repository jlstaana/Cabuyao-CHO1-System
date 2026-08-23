const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// Normalize line endings to \n
file = file.replace(/\r\n/g, "\n");

// DoctorView useState('Pending') -> useState('Scheduled')
file = file.replace(/const \[tab, setTab\] = useState\('Pending'\);/g, "const [tab, setTab] = useState('Scheduled');");

// DoctorView cards
const docCardsOld = `{[
          { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          ].map(s => (`.replace(/\r\n/g, "\n");
const docCardsNew = `{[
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
          { label: 'Cancelled', status: 'Cancelled', count: cancelled.length, sub: 'Discontinued' },
        ].map(s => (`.replace(/\r\n/g, "\n");
file = file.replace(docCardsOld, docCardsNew);

// tabs arrays
file = file.replace(/\{\s*\[\s*'Pending',\s*'Scheduled',\s*'Completed'\s*\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");
file = file.replace(/\{\s*\[\s*'Pending',\s*'Scheduled'\s*\]\.map\(t => \{/g, "{['Scheduled', 'Completed', 'Cancelled'].map(t => {");

// badge logic
file = file.replace(/\{counts\[t\] > 0 && t === 'Pending' && \([\s\S]*?\}\)/g, "");

// Accept buttons
const btnOld = `{c.status === 'Pending' && (
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
file = file.replace(btnOld, "");
// Check for other variants of c.status === 'Pending' buttons
file = file.replace(/\{c\.status === 'Pending' && \([\s\S]*?<\/button>\s*<\/div>\s*\)\}/g, "");

// Empty state strings
file = file.replace(/\{tab === 'Pending' \? 'No pending request\.' : `No \$\{tab\.toLowerCase\(\)\} consultations\.`\}/g, "`No \\${tab.toLowerCase()} consultations.`");
file = file.replace(/\{c\.status === 'Pending' \? 'Preferred' : 'Scheduled'\}/g, "'Scheduled'");

// AdminView cards
file = file.replace(/\{\s*status:\s*'Pending',\s*sub:\s*'Awaiting assignment'\s*\},\s*/g, "");

// AdminView Grid
file = file.replace(/<div data-tour="page-stats" className="grid grid-cols-2 gap-3">/, '<div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">');

const adminCardsOld = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          
          
        ].map(s => (`.replace(/\r\n/g, "\n");
const adminCardsNew = `        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Finished sessions' },
          { status: 'Cancelled', sub: 'Discontinued' },
        ].map(s => (`.replace(/\r\n/g, "\n");
file = file.replace(adminCardsOld, adminCardsNew);

fs.writeFileSync('../frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Foolproof patch applied');
