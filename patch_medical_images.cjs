const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

// 1. Add state for medicalImages
if (!file.includes('const [medicalImages, setMedicalImages]')) {
  file = file.replace(
    'const [doctors, setDoctors]     = useState([]);',
    'const [doctors, setDoctors]     = useState([]);\n  const [medicalImages, setMedicalImages] = useState([]);'
  );
}

// 2. Add fetch in useEffect
const fetchRegex = /api\.get\('\/consultations'\)\s*\.then\(res => \{\s*if \(isActive\) setConsultations\(res\.data\);\s*\}\)\s*\.catch\(\(\) => \{ if \(isActive\) toast\.error\('Failed to load consultations'\); \}\)\s*\.finally\(\(\) => \{\s*if \(isActive\) setLoading\(false\);\s*\}\);/;
if (!file.includes("api.get('/medical-images')")) {
  file = file.replace(fetchRegex, `$&
      if (user?.role === 'Patient') {
        api.get('/medical-images')
          .then(res => { if (isActive) setMedicalImages(res.data); })
          .catch(console.error);
      }
`);
}

// 3. Add UI in Request Modal
// We'll insert it right after the "Additional Notes" textarea div
const notesRegex = /<div>\s*<label className="block text-sm font-medium text-text-muted mb-1">Additional Notes<\/label>[\s\S]*?<\/textarea>\s*<\/div>/;

const medicalImagesUI = `
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Attached Medical Images</label>
            {medicalImages.length > 0 ? (
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="max-h-32 overflow-y-auto divide-y divide-border">
                  {medicalImages.map(img => (
                    <div key={img.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-text truncate">{img.original_name || img.file_path.split('/').pop()}</span>
                        <span className="text-[10px] text-text-light">{img.document_type || 'Document'}</span>
                      </div>
                      <span className="shrink-0 ml-2 inline-flex items-center rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-bold text-success-text">Attached</span>
                    </div>
                  ))}
                </div>
                <div className="bg-background px-3 py-2 border-t border-border">
                  <p className="text-xs text-text-light">
                    These files will be automatically accessible to your doctor. <Link to="/medicines" className="text-sky-600 font-medium hover:underline">Manage images</Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-center">
                <p className="text-xs text-text-muted">No medical images attached.</p>
                <Link to="/medicines" className="mt-2 inline-block text-xs font-medium text-sky-600 hover:underline">
                  Upload images beforehand
                </Link>
              </div>
            )}
          </div>
`;

file = file.replace(notesRegex, `$&` + '\n' + medicalImagesUI);

// Fix the link to point to /medical-images instead of /medicines? No wait, is it /medicines or /medical-images?
// The page is imported as MedicalImages but let's check the route.
