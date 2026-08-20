const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');

const replaceInView = (viewName, tabStateStr) => {
    let reState = new RegExp(`const \\[tab, setTab\\] = useState\\('${tabStateStr}'\\);`);
    file = file.replace(reState, `const [tab, setTab] = useState('${tabStateStr}');\n    const [viewMode, setViewMode] = useState('list');`);
    
    let reSearch = new RegExp(`(function ${viewName}[\\s\\S]*?<Search size=\\{15\\}[\\s\\S]*?\\{search && \\([\\s\\S]*?<\\/button>\\n\\s*\\)\\}\\n\\s*<\\/div>)`);
    
    file = file.replace(reSearch, (match) => {
        if (match.includes('LayoutList')) return match;
        const toggle = `
            </div>
            <div className="flex border border-border rounded-xl bg-surface p-1 shrink-0 ml-2">
              <button 
                onClick={() => setViewMode('list')} 
                className={\`p-1.5 rounded-lg transition-colors \${viewMode === 'list' ? 'bg-background shadow-sm text-sky-600' : 'text-text-muted hover:text-text'}\`}
                title="List View"
              >
                <LayoutList size={16} />
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={\`p-1.5 rounded-lg transition-colors \${viewMode === 'calendar' ? 'bg-background shadow-sm text-sky-600' : 'text-text-muted hover:text-text'}\`}
                title="Calendar View"
              >
                <CalendarIcon size={16} />
              </button>
            </div>`;
        return match + toggle;
    });
    
    let reListStart = new RegExp(`(function ${viewName}[\\s\\S]*?)\\{\\/\\* Cards \\*\\/\\}`);
    if (file.match(reListStart)) {
      file = file.replace(reListStart, `$1{/* Content */}\n        {viewMode === 'calendar' ? (\n          <ConsultationCalendar consultations={filtered} onViewConsultation={() => {}} />\n        ) : (\n        <div className="space-y-3">`);
      
      let reListEnd = new RegExp(`(function ${viewName}[\\s\\S]*?)(<\\/div>\\n\\s*\\);\\n\\s*\\}\\)\\}[\n\\s]*<\\/div>[\n\\s]*<\\/div>[\n\\s]*\\);\\n\\})`);
      file = file.replace(reListEnd, `$1$2\n        )}`);
      // It's getting too complicated to regex the end correctly. Let's just do it cleanly via file replace for each view.
    }
};

replaceInView('PatientView', 'All');
replaceInView('DoctorView', 'Pending');
replaceInView('AdminView', 'Scheduled');

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
