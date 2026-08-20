const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const applyView = (viewName, tabInit) => {
    // State
    content = content.replace(
        new RegExp(`const \\[tab, setTab\\] = useState\\('${tabInit}'\\);`),
        `const [tab, setTab] = useState('${tabInit}');\n  const [viewMode, setViewMode] = useState('list');`
    );

    // Toggle button
    const toggleStr = `
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all shrink-0"
            >
              <X size={13} /> Clear
            </button>
          )}
          <div className="flex border border-border rounded-xl bg-surface p-1 shrink-0 ml-1">
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
          </div>
        </div>
      </div>
`;
    // Find the end of the search bar block
    const searchRegex = new RegExp(`(function ${viewName}[\\s\\S]*?\\{search && \\([\\s\\S]*?<X size=\\{13\\} \\/> Clear\\n\\s*<\\/button>\\n\\s*\\)\\}\\n\\s*<\\/div>\\n\\s*<\\/div>)`);
    
    content = content.replace(searchRegex, (match) => {
        if (match.includes('CalendarIcon size={16}')) return match; // already injected
        // Just replace the end part
        return match.replace(/\{search && \([\s\S]*?<\/div>\n\s*<\/div>$/, toggleStr.trim());
    });
    
    // Inject calendar view condition
    let listStartMatch;
    if (viewName === 'AdminView') {
      listStartMatch = `        {/* Table */}\n        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">`;
    } else {
      listStartMatch = `        {/* Queue list */}\n        <div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">`;
    }
    
    const calendarRender = `        {viewMode === 'calendar' ? (\n          <ConsultationCalendar consultations={filtered} onViewConsultation={() => {}} />\n        ) : (\n${listStartMatch}`;
    
    content = content.replace(listStartMatch, calendarRender);
    
    // Close ternary
    const endMatch = new RegExp(`(function ${viewName}[\\s\\S]*?)(<\\/div>\\n\\s*\\);\\n\\s*\\}\\)\\}[\n\\s]*<\\/div>[\n\\s]*<\\/div>[\n\\s]*\\);\\n\\})`);
    content = content.replace(endMatch, `$1$2\n        )}`);
};

applyView('DoctorView', 'Pending');
applyView('AdminView', 'Scheduled');
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', content);
