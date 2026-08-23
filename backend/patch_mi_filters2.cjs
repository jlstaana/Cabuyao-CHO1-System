const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', 'utf-8');

const regex = /<div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">[\s\S]*?<div className="p-5 border-b border-border">[\s\S]*?<h2 className="font-semibold text-text flex items-center gap-2">[\s\S]*?<\/h2>[\s\S]*?<\/div>/;

const listSectionNew = `
  const filteredUploads = uploads.filter(img => {
    const matchesSearch = (img.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (img.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || img.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    // We need to just inject the filteredUploads right before the return, but since we are inside the JSX, we can't!
    // Ah, wait! The regex matches the JSX! 
`;
// Let's do it better.
const returnIdx = file.lastIndexOf('return (');
const beforeReturn = file.substring(0, returnIdx);
const afterReturn = file.substring(returnIdx);

const injectLogic = `
  const filteredUploads = uploads.filter(img => {
    const matchesSearch = (img.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (img.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || img.type === filterType;
    return matchesSearch && matchesType;
  });

`;

file = beforeReturn + injectLogic + afterReturn;

// Now for the UI part
const uiRegex = /<div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">\s*<div className="p-5 border-b border-border">\s*<h2 className="font-semibold text-text flex items-center gap-2">\s*<Folder size=\{16\} className="text-indigo-500" \/> My Uploaded Files\s*<\/h2>\s*<\/div>/;

const newUI = `<div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-text flex items-center gap-2 shrink-0">
            <Folder size={16} className="text-indigo-500" /> My Uploaded Files
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search files or notes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-sky-500/20 outline-none w-full sm:w-48"
            />
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="All">All Types</option>
              {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>`;

file = file.replace(uiRegex, newUI);

fs.writeFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', file);
console.log('Patched MedicalImages with filters UI');
