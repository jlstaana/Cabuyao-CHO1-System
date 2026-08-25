import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Folder, Upload, X, Eye, FileImage, CheckCircle,
  AlertCircle, Info, Loader, FileText, Download,
} from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_MB = 20;
const IMAGE_MIME_PREFIX = 'image/';

export const DOCUMENT_CATEGORIES = [
  {
    category: 'Identification & Priority Cards',
    icon: '🆔',
    types: [
      'PWD ID Card',
      'Senior Citizen ID',
      'Disability Certificate',
      'PhilHealth Member ID',
      'Barangay Health Certificate / Indigency',
      'Government / National ID',
    ]
  },
  {
    category: 'Clinical & Diagnostic Records',
    icon: '🩺',
    types: [
      'Medical Certificate',
      'Lab Test Results',
      'Prescription Photo',
      'X-Ray',
      'CT Scan',
      'Ultrasound',
      'Other',
    ]
  }
];

const ALL_DOCUMENT_TYPES = DOCUMENT_CATEGORIES.flatMap(c => c.types);

function formatSize(bytes) {
  if (!bytes) return 'N/A';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function isImageType(mimeType = '') {
  return mimeType.startsWith(IMAGE_MIME_PREFIX);
}

function fileLabel(file) {
  return file.document_type || file.file_type?.toUpperCase() || 'Medical File';
}

function formatUploads(images) {
  return images.map((image) => ({
    id: image.id,
    name: image.original_name || image.file_path?.split('/').pop() || `Medical file #${image.id}`,
    type: fileLabel(image),
    mimeType: image.mime_type || '',
    fileType: image.file_type || '',
    notes: image.notes || 'Patient Upload',
    date: image.created_at ? new Date(image.created_at).toLocaleDateString() : 'N/A',
    size: formatSize(image.file_size),
    status: 'Uploaded',
  }));
}

export default function MedicalImages() {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  const [uploads, setUploads] = useState([]);

  const [previews, setPreviews] = useState([]); // files staged for upload
  const [selectedCategory, setSelectedCategory] = useState('Identification & Priority Cards');
  const [imageType, setImageType] = useState('PWD ID Card');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // url for lightbox preview

  useEffect(() => {
    if (user?.role !== 'Patient') return;
    let isActive = true;
    api.get('/medical-images')
      .then((res) => {
        if (isActive) {
          setUploads(formatUploads(res.data || []));
        }
      })
      .catch(() => {
        if (isActive) setUploads([]);
      });
    return () => { isActive = false; };
  }, [user]);

  // Guard: Patient only
  if (user?.role !== 'Patient') {
    return (
      <div className="p-8 text-center text-text-muted bg-surface rounded-2xl shadow-sm border border-border">
        This page is only accessible to patients.
      </div>
    );
  }

  // ── File handling ───────────────────────────────────────────────────────────
  const addFiles = (files) => {
    const valid = Array.from(files).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported file type.`);
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name}: file exceeds ${MAX_SIZE_MB} MB limit.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    const withPreviews = valid.map((f) => ({
      file: f,
      url: isImageType(f.type) ? URL.createObjectURL(f) : null,
      name: f.name,
      type: f.type,
      extension: f.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: formatSize(f.size),
    }));
    setPreviews((prev) => [...prev, ...withPreviews]);
  };

  const removePreview = (idx) => {
    setPreviews((prev) => {
      if (prev[idx].url) URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previews.length) { toast.error('Please select at least one file.'); return; }
    setUploading(true);
    try {
      const saved = [];
      for (const preview of previews) {
        const fd = new FormData();
        fd.append('image', preview.file);
        fd.append('document_type', imageType);
        if (notes) fd.append('notes', notes);
        const { data } = await api.post(`/medical-images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        saved.push(data.image);
      }
      const newEntries = previews.map((p, i) => ({
        id: saved[i]?.id || Date.now() + i,
        name: p.name,
        type: saved[i]?.document_type || imageType,
        mimeType: saved[i]?.mime_type || p.type,
        fileType: saved[i]?.file_type || p.extension,
        notes: notes || 'Patient Upload',
        date: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: p.size,
        status: 'Uploaded',
      }));
      setUploads((prev) => [...newEntries, ...prev]);
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
      setPreviews([]);
      setNotes('');
      setImageType('X-Ray');
      toast.success(`${newEntries.length} file(s) uploaded successfully!`);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const STATUS_STYLE = {
    'Reviewed':       'bg-emerald-100 text-success-text',
    'Pending Review': 'bg-amber-100 text-warning-text',
    'Uploaded':       'bg-primary-hover text-primary-text',
  };

  const handleDownload = async (upload) => {
    try {
      const response = await api.get(`/medical-images/${upload.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: upload.mimeType || 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = upload.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  
  const filteredUploads = uploads.filter(img => {
    const matchesSearch = (img.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (img.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || img.type === filterType;
    return matchesSearch && matchesType;
  });

return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <header>
        <PageTitle icon={Folder} title="Medical Documents" description="Upload X-rays, lab test results, and other medical documents for your doctor to review." iconClassName="bg-brand-bg text-indigo-600" />
      </header>

      {/* Upload form */}
      <form data-tour="page-form" onSubmit={handleSubmit} className="rounded-2xl border border-transparent bg-gradient-to-br from-sky-500 to-blue-600 p-6 space-y-5">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Folder size={18} /> Upload New File
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-white bg-white/20'
              : 'border-white/40 bg-white/10 hover:border-white/60 hover:bg-white/20'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <Upload size={28} />
          </div>
          <div className="text-center text-white">
            <p className="font-bold">Drag &amp; drop files here</p>
            <p className="text-sm text-white/80 mt-1">or click to browse — JPG, PNG, WEBP, PDF, DOC up to {MAX_SIZE_MB} MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Staged previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/20 aspect-square bg-white/10">
                {p.url ? (
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-transparent text-white/80">
                    <FileText size={34} />
                    <span className="text-xs font-bold">{p.extension}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {p.url && (
                    <button type="button" onClick={() => setLightbox(p.url)} className="p-1.5 bg-white rounded-lg text-text-muted hover:text-sky-600">
                      <Eye size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => removePreview(idx)} className="p-1.5 bg-white rounded-lg text-text-muted hover:text-rose-600">
                    <X size={16} />
                  </button>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-slate-900/60 px-2 py-1 truncate">{p.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Metadata fields: Separate Category, Document Type, and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/90 mb-1 uppercase tracking-wide">
              1. Document Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                const firstType = DOCUMENT_CATEGORIES.find(c => c.category === newCat)?.types[0] || 'Other';
                setImageType(firstType);
              }}
              className="w-full px-4 py-2.5 rounded-xl border-none bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/30 shadow-inner font-bold text-sm"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.icon} {cat.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/90 mb-1 uppercase tracking-wide">
              2. Specific Document Type / ID
            </label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-none bg-white text-slate-900 outline-none focus:ring-4 focus:ring-white/30 shadow-inner font-medium text-sm"
            >
              {(DOCUMENT_CATEGORIES.find(c => c.category === selectedCategory)?.types || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/90 mb-1 uppercase tracking-wide">
              3. Notes / ID Number (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ID #1234-5678 or Clinic name"
              className="w-full px-4 py-2.5 rounded-xl border-none bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-4 focus:ring-white/30 shadow-inner font-medium text-sm"
            />
          </div>
        </div>

        <div className="bg-white/20 border border-white/30 rounded-xl px-4 py-3 flex gap-3 text-sm text-white">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>Uploaded files are securely stored in your personal medical record and visible to your doctors during consultations.</span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !previews.length}
            className="flex items-center gap-2 bg-white text-sky-600 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : `Upload ${previews.length ? `(${previews.length})` : ''}`}
          </button>
        </div>
      </form>

      {/* Uploaded images list */}
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
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-sky-500/20 outline-none font-medium"
            >
              <option value="All">All Documents</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                  {cat.types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        {filteredUploads.length === 0 ? (
          <div className="p-12 text-center text-text-light">
            <Folder size={32} className="mx-auto mb-3 opacity-30" />
            <p>No files uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredUploads.map((img) => (
              <div key={img.id} className="flex items-center gap-4 px-5 py-4 hover:bg-background/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center flex-shrink-0">
                  {isImageType(img.mimeType) ? <FileImage size={20} className="text-indigo-500" /> : <FileText size={20} className="text-indigo-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text text-sm truncate">{img.name}</p>
                  <p className="text-xs text-text-light mt-0.5">{img.notes || '—'} · {img.date} · {img.size}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-bg text-primary-text">{img.type}</span>
                  <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-hover/50 text-text-muted">{img.fileType?.toUpperCase()}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_STYLE[img.status] || 'bg-surface-hover/50 text-text-muted'}`}>
                    {img.status === 'Reviewed' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {img.status}
                  </span>
                  <button type="button" onClick={() => handleDownload(img)} className="p-2 rounded-lg text-text-light hover:text-primary-text hover:bg-primary-bg transition-colors" title="Download file">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-surface rounded-full flex items-center justify-center shadow-lg dark:shadow-none text-text-muted hover:text-danger-text"
            >
              <X size={16} />
            </button>
            <img src={lightbox} alt="Preview" className="w-full rounded-2xl shadow-2xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

