const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const notesRegex = /<div>\s*<label className="block text-sm font-medium text-text-muted mb-1">Additional Notes<\/label>[\s\S]*?\/>\s*<\/div>/;

const newAttachUI = `
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-muted">Attached Medical Images</label>
              <div>
                <input type="file" id="mini-upload" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" onChange={handleMiniUpload} disabled={isUploadingMini} />
                <label htmlFor="mini-upload" className={\`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer transition-colors \${isUploadingMini ? 'opacity-50 cursor-wait' : ''}\`}>
                  <FilePlus size={12} />
                  {isUploadingMini ? 'Uploading...' : 'Quick Upload'}
                </label>
              </div>
            </div>
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
                <div className="bg-background px-3 py-2 border-t border-border flex justify-between items-center">
                  <p className="text-[10px] text-text-light">
                    These files will be accessible to your doctor.
                  </p>
                  <Link to="/medical-images" className="text-[10px] text-sky-600 font-medium hover:underline">Manage all</Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-center">
                <p className="text-xs text-text-muted">No medical images attached.</p>
                <p className="text-[10px] text-text-light mt-1">Click "Quick Upload" above to attach files directly.</p>
              </div>
            )}
          </div>
`;

if (file.match(notesRegex)) {
  file = file.replace(notesRegex, `$&` + '\n' + newAttachUI);
  fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
  console.log('Successfully added UI');
} else {
  console.log('Regex did not match');
}
