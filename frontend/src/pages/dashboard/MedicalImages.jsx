import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  ImagePlus, Upload, X, Eye, FileImage, CheckCircle,
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

const IMAGE_TYPES = [
  'X-Ray',
  'Lab Result',
  'Prescription Photo',
  'Medical Certificate',
  'CT Scan',
  'Ultrasound',
  'Other',
];

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
  const [consultations, setConsultations] = useState([]);
  const [previews, setPreviews] = useState([]); // files staged for upload
  const [imageType, setImageType] = useState('X-Ray');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null); // url for lightbox preview

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
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
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
    if (!previews.length) { toast.error('Please select at least one image.'); return; }
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
      toast.success(`${newEntries.length} image(s) uploaded successfully!`);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const STATUS_STYLE = {
    'Reviewed':       'bg-emerald-100 text-emerald-700',
    'Pending Review': 'bg-amber-100 text-amber-700',
    'Uploaded':       'bg-sky-100 text-sky-700',
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <SEO title="Upload Medical Image" description="Upload and manage your medical images" />

      {/* Header */}
      <header>
        <PageTitle icon={ImagePlus} title="Medical Images" description="Upload X-rays, lab results, and other medical documents for your doctor to review." iconClassName="bg-indigo-50 text-indigo-600" />
      </header>

      {/* Upload form */}
      <form data-tour="page-form" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <ImagePlus size={18} className="text-sky-500" /> Upload New Image
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-sky-400 bg-sky-50'
              : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
            <Upload size={28} className="text-sky-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700">Drag &amp; drop images here</p>
            <p className="text-sm text-slate-400 mt-1">or click to browse — JPG, PNG, WEBP, PDF, DOC up to {MAX_SIZE_MB} MB</p>
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
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                {p.url ? (
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500">
                    <FileText size={34} />
                    <span className="text-xs font-bold">{p.extension}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {p.url && (
                    <button type="button" onClick={() => setLightbox(p.url)} className="p-1.5 bg-white rounded-lg text-slate-700 hover:text-sky-600">
                      <Eye size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => removePreview(idx)} className="p-1.5 bg-white rounded-lg text-slate-700 hover:text-rose-600">
                    <X size={16} />
                  </button>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-slate-900/60 px-2 py-1 truncate">{p.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Metadata fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image Type</label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {IMAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Taken at Cabuyao District Hospital"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 flex gap-3 text-sm text-sky-700">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>Uploaded images are securely stored in your personal medical gallery and visible to your doctors during consultations.</span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !previews.length}
            className="flex items-center gap-2 bg-sky-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : `Upload ${previews.length ? `(${previews.length})` : ''}`}
          </button>
        </div>
      </form>

      {/* Uploaded images list */}
      <div data-tour="page-list" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileImage size={16} className="text-indigo-500" /> My Uploaded Images
          </h2>
        </div>
        {uploads.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileImage size={32} className="mx-auto mb-3 opacity-30" />
            <p>No images uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {uploads.map((img) => (
              <div key={img.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  {isImageType(img.mimeType) ? <FileImage size={20} className="text-indigo-500" /> : <FileText size={20} className="text-indigo-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{img.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{img.notes || '—'} · {img.date} · {img.size}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">{img.type}</span>
                  <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{img.fileType?.toUpperCase()}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_STYLE[img.status] || 'bg-slate-100 text-slate-500'}`}>
                    {img.status === 'Reviewed' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {img.status}
                  </span>
                  <button type="button" onClick={() => handleDownload(img)} className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Download file">
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
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-700 hover:text-rose-600"
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
