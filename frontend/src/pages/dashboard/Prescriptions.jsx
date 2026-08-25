import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { FileText, Download, User, Edit, Plus, Trash2, Save, Calendar, Search, X, Filter, Activity, Pill, Stethoscope, PenLine, Eraser, CheckCircle } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import Modal from '../../components/Modal';
import useAuthStore from '../../store/useAuthStore';

const emptyItem = { medicine_id: '', dosage: '', frequency: '', duration: '', instructions: '' };

function StatCard({ label, value, icon: Icon, color, sub }) {
  const isIndigo = color?.includes('indigo');
  const isEmerald = color?.includes('emerald');
  const isRose = color?.includes('rose');
  const isAmber = color?.includes('amber');
  const isFuchsia = color?.includes('fuchsia');
  const isSlate = color?.includes('slate');

  const bgGradient = isIndigo ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                     isEmerald ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                     isRose ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                     isAmber ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                     isFuchsia ? 'bg-gradient-to-br from-fuchsia-600 to-purple-700' :
                     isSlate ? 'bg-gradient-to-br from-slate-600 to-slate-800' :
                     'bg-gradient-to-br from-sky-500 to-blue-600';

  return (
    <div data-tour="page-stats" className={`p-5 rounded-2xl border border-transparent ${bgGradient}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</span>
        <div className="p-2 rounded-xl bg-white/20 text-white">
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-black mt-1 text-white">{value}</p>
      {sub && <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">{sub}</p>}
    </div>
  );
}

export default function Prescriptions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ notes: '', items: [{ ...emptyItem }] });

  // Filter state
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await api.get('/prescriptions');
        setPrescriptions(response.data);
      } catch {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (user?.role !== 'Doctor') return;
    api.get('/medicines')
      .then((response) => setMedicines(response.data || []))
      .catch(() => setMedicines([]));
  }, [user?.role]);

  // Derived filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prescriptions.filter(p => {
      const matchSearch = !q
        || p.patient?.user?.name?.toLowerCase().includes(q)
        || p.doctor?.user?.name?.toLowerCase().includes(q)
        || (p.notes || '').toLowerCase().includes(q)
        || `rx-${String(p.id).padStart(6, '0')}`.includes(q);

      const issueDate = new Date(p.created_at);
      const matchFrom = !dateFrom || issueDate >= new Date(dateFrom);
      const matchTo   = !dateTo   || issueDate <= new Date(dateTo + 'T23:59:59');

      return matchSearch && matchFrom && matchTo;
    });
  }, [prescriptions, search, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || dateFrom || dateTo;

  const handleDownload = async (prescriptionId) => {
    setDownloadingId(prescriptionId);
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CHO1_Prescription_RX-${String(prescriptionId).padStart(6, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Prescription PDF downloaded!');
    } catch (err) {
      let msg = 'Failed to download prescription PDF';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) msg = json.message;
        } catch {
          /* fallback to default */
        }
      }
      toast.error(msg);
    } finally {
      setDownloadingId(null);
    }
  };

      // E-Signature: Crisp, Non-Cutting, Ultra-Responsive Pen Engine
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [signatureStrokes, setSignatureStrokes] = useState([]);
  const [hasSignature, setHasSignature] = useState(false);

  const getCanvasPoint = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startSignature = (e) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(e);
    isDrawingRef.current = true;
    lastPointRef.current = point;

    setSignatureStrokes((prev) => [...prev, [point]]);
    setHasSignature(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f2b5c';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#0f2b5c';
    ctx.fill();
  };

  const drawSignature = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(e);
    const prevPoint = lastPointRef.current;
    if (!prevPoint) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f2b5c';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;

    setSignatureStrokes((prev) => {
      if (!prev.length) return [[point]];
      const next = [...prev];
      next[next.length - 1] = [...next[next.length - 1], point];
      return next;
    });
  };

  const stopSignature = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    lastPointRef.current = null;
    setSignatureStrokes([]);
    setHasSignature(false);
  };

  const buildSignatureSvg = () => {
    const strokes = signatureStrokes.filter((stroke) => stroke.length > 0);
    if (!strokes.length) return null;
    const points = strokes.flat();
    if (!points.length) return null;

    // Generous bounding box margin (30px) so wide loops & flourishes are NEVER cut off
    const rawMinX = Math.min(...points.map((p) => p.x));
    const rawMinY = Math.min(...points.map((p) => p.y));
    const rawMaxX = Math.max(...points.map((p) => p.x));
    const rawMaxY = Math.max(...points.map((p) => p.y));

    const minX = Math.max(0, rawMinX - 30);
    const minY = Math.max(0, rawMinY - 20);
    const maxX = Math.min(800, rawMaxX + 30);
    const maxY = Math.min(240, rawMaxY + 20);
    const viewBoxWidth = Math.max(120, maxX - minX);
    const viewBoxHeight = Math.max(45, maxY - minY);

    const paths = strokes
      .map((stroke) => {
        if (stroke.length === 1) {
          return `<circle cx="${stroke[0].x.toFixed(1)}" cy="${stroke[0].y.toFixed(1)}" r="1.5" fill="#0f2b5c"/>`;
        }
        const [first, ...rest] = stroke;
        const d = [
          `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
          ...rest.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
        ].join(' ');
        return `<path d="${d}" fill="none" stroke="#0f2b5c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${viewBoxWidth.toFixed(1)} ${viewBoxHeight.toFixed(1)}" width="140" height="42" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
  };

  const openEdit = (prescription) => {
    setSelected(prescription);
    setSignatureStrokes([]);
    setHasSignature(false);
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 50);
    setEditForm({
      notes: prescription.notes || '',
      items: prescription.items?.length
        ? prescription.items.map((item) => ({
            medicine_id: String(item.medicine_id || ''),
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
            instructions: item.instructions || '',
          }))
        : [{ ...emptyItem }],
    });
    setEditModal(true);
  };

  const updateItem = (index, key, value) => {
    setEditForm((form) => ({
      ...form,
      items: form.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  };

  const addItem = () => {
    setEditForm((form) => ({ ...form, items: [...form.items, { ...emptyItem }] }));
  };

  const removeItem = (index) => {
    setEditForm((form) => ({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        notes: editForm.notes,
        items: editForm.items.map((item) => ({ ...item, medicine_id: Number(item.medicine_id) })),
      };
      if (hasSignature) {
        const svg = buildSignatureSvg();
        if (svg) payload.doctor_signature_svg = svg;
      }
      const response = await api.put(`/prescriptions/${selected.id}`, payload);
      const updated = response.data?.prescription;
      if (updated) {
        setPrescriptions((rows) => rows.map((row) => row.id === updated.id ? updated : row));
      }
      toast.success(response.data?.message || 'Prescription updated.');
      setEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update error. Previous prescription was kept.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <PageTitle icon={FileText} title="E-Prescriptions" description="Access and manage digitally signed medical prescriptions." iconClassName="bg-success-bg text-emerald-600" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Total Prescriptions" 
          value={prescriptions.length} 
          icon={FileText} 
          color="sky" 
          sub="All records" 
        />
        <StatCard 
          label="Issued Today" 
          value={prescriptions.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length} 
          icon={Activity} 
          color="emerald" 
          sub="Today's volume" 
        />
        <StatCard 
          label="Items Prescribed" 
          value={prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0)} 
          icon={Pill} 
          color="indigo" 
          sub="Total medicines dispensed" 
        />
        <StatCard 
          label="Active Doctors" 
          value={new Set(prescriptions.map(p => p.doctor_id).filter(Boolean)).size} 
          icon={Stethoscope} 
          color="amber" 
          sub="Prescribing physicians" 
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              id="prescription-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient, doctor, notes, or Rx number..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Toggle filter panel */}
          <button
            id="prescription-filter-toggle"
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
              showFilters || (dateFrom || dateTo)
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-surface border-border text-text-muted hover:bg-surface-hover'
            }`}
          >
            <Filter size={15} />
            Filter
            {(dateFrom || dateTo) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              id="prescription-clear-filters"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-sm font-medium hover:bg-rose-100 transition-all"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Date filter panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-surface animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Date From</label>
              <input
                id="prescription-date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Date To</label>
              <input
                id="prescription-date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text">{filtered.length}</span> of <span className="font-semibold text-text">{prescriptions.length}</span> prescriptions
          </p>
        )}
      </div>

      <div data-tour="page-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-48 mb-6" />
                <Skeleton className="h-10 w-full" />
             </div>
           ))
        ) : filtered.length === 0 ? (
           <div className="col-span-full p-8 text-center text-text-muted bg-surface rounded-2xl border border-border">
             {hasActiveFilters ? (
               <div className="space-y-2">
                 <p className="font-medium">No prescriptions match your search.</p>
                 <button onClick={clearFilters} className="text-sm text-emerald-600 hover:underline">Clear filters</button>
               </div>
             ) : 'No prescriptions found.'}
           </div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-text-muted">RX-{String(p.id).padStart(6, '0')}</span>
                <h3 className="font-bold text-lg text-text line-clamp-1 mt-0.5">
                  {p.notes || 'Prescription Details'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-success-bg text-emerald-600 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
            </div>

            <div className="space-y-2.5 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <User size={15} className="text-text-light" /> <span className="font-semibold text-text">Patient:</span> {p.patient?.user?.name || 'Unknown Patient'}
              </p>
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <Stethoscope size={15} className="text-text-light" /> <span className="font-semibold text-text">Prescribed By:</span> Dr. {p.doctor?.user?.name || 'Unknown Doctor'}
              </p>
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <Calendar size={15} className="text-text-light" /> <span className="font-semibold text-text">Issued On:</span> {new Date(p.created_at).toLocaleDateString()}
              </p>

              <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-2 text-xs text-text-light bg-surface-hover/40 px-3 py-2 rounded-xl">
                <span>🔒</span>
                <span className="italic">Medication details are encrypted & confidential. Download official PDF to view.</span>
              </div>
            </div>

            <div className="space-y-2">
              {user?.role === 'Doctor' && (
                <button
                  onClick={() => openEdit(p)}
                  className="w-full flex items-center justify-center gap-2 bg-success-bg text-success-text py-2.5 rounded-xl font-medium hover:bg-emerald-100 transition-colors border border-success-border"
                >
                  <Edit size={17} /> Edit Prescription
                </button>
              )}
              <button
                onClick={() => handleDownload(p.id)}
                disabled={downloadingId === p.id}
                className="w-full flex items-center justify-center gap-2 bg-background text-text-muted py-2.5 rounded-xl font-medium hover:bg-success-bg hover:text-success-text transition-colors border border-border hover:border-emerald-200"
              >
                <Download size={18} /> {downloadingId === p.id ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Update E-Prescription">
        {selected && (
          <form data-tour="page-form" onSubmit={handleUpdate} className="space-y-4">
            <div className="rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text">
              Modify the medicine, dosage, frequency, duration, or instructions. Invalid updates keep the previous prescription unchanged.
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Prescription Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-muted">Medicines</p>
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 rounded-lg bg-success-bg px-3 py-1.5 text-xs font-bold text-success-text hover:bg-emerald-100">
                  <Plus size={13} /> Add Medicine
                </button>
              </div>

              {editForm.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-background p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <select required value={item.medicine_id} onChange={(e) => updateItem(index, 'medicine_id', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="">Select medicine...</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeItem(index)} disabled={editForm.items.length === 1} className="inline-flex items-center justify-center rounded-lg bg-surface px-3 py-2 text-rose-500 border border-border hover:bg-danger-bg disabled:opacity-40 disabled:cursor-not-allowed">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input required value={item.dosage} onChange={(e) => updateItem(index, 'dosage', e.target.value)} placeholder="Dosage" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <input required value={item.frequency} onChange={(e) => updateItem(index, 'frequency', e.target.value)} placeholder="Frequency" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <input value={item.duration} onChange={(e) => updateItem(index, 'duration', e.target.value)} placeholder="Duration" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <textarea value={item.instructions} onChange={(e) => updateItem(index, 'instructions', e.target.value)} rows={2} placeholder="Instructions" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                </div>
              ))}
            </div>

            {/* Doctor E-Signature Update Pad */}
            <div className="border border-border rounded-2xl bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <PenLine size={14} className="text-emerald-600" /> Updated Doctor E-Signature
                  </span>
                  <p className="text-[11px] text-text-light mt-0.5">
                    Draw your signature below for this update, or leave blank to keep your current signature on file.
                  </p>
                </div>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs bg-surface-hover/70 text-text-muted px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 shrink-0"
                  >
                    <Eraser size={12} /> Clear
                  </button>
                )}
              </div>
              
              <div className="w-full">
                <canvas
                  ref={signatureCanvasRef}
                  width={720}
                  height={180}
                  onMouseDown={startSignature}
                  onMouseMove={drawSignature}
                  onMouseUp={stopSignature}
                  onMouseLeave={stopSignature}
                  onTouchStart={startSignature}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopSignature}
                  className="h-36 w-full rounded-xl bg-background cursor-crosshair touch-none border border-border shadow-inner"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setEditModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-200">
                <Save size={16} /> Submit Update & Sign
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

