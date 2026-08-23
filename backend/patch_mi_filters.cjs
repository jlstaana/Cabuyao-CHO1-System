const fs = require('fs');
let file = fs.readFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', 'utf-8');

// 1. Fix corrupted characters
file = file.replace(/A\uFFFD/g, " | ");
file = file.replace(/·/g, " | ");

// 2. Add state variables for search and filter
file = file.replace(
  /const \[lightbox, setLightbox\] = useState\(null\);/,
  `const [lightbox, setLightbox] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');`
);

// 3. Add Search/Filter UI and filtering logic
const listSectionOld = `<div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <FileImage size={16} className="text-indigo-500" /> My Uploaded Files
          </h2>
        </div>`;

const listSectionNew = `
  const filteredUploads = uploads.filter(img => {
    const matchesSearch = (img.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (img.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || img.type === filterType;
    return matchesSearch && matchesType;
  });

  <div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
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

file = file.replace(listSectionOld, listSectionNew);

// 4. Change `uploads.map` to `filteredUploads.map`
file = file.replace(/uploads\.map/g, "filteredUploads.map");
file = file.replace(/uploads\.length === 0/g, "filteredUploads.length === 0");

// 5. Ensure FileImage icon in list view is changed to Folder or FileText if we didn't do it before
file = file.replace(/<FileImage size=\{32\}/g, "<Folder size={32}");
file = file.replace(/<FileImage size=\{16\}/g, "<Folder size={16}");

fs.writeFileSync('../frontend/src/pages/dashboard/MedicalImages.jsx', file);
console.log('Patched MedicalImages with filters');
