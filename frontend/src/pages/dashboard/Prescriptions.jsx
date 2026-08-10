import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { FileText, Download, User, Edit, Plus, Trash2, Save, Calendar, Search, X, Filter, Activity, Pill, Stethoscope } from 'lucide-react';
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

  const bgGradient = isIndigo ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200' :
                     isEmerald ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' :
                     isRose ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200' :
                     isAmber ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200' :
                     isFuchsia ? 'bg-gradient-to-br from-fuchsia-600 to-purple-700 shadow-fuchsia-200' :
                     isSlate ? 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-300' :
                     'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-200';

  return (
    <div data-tour="page-stats" className={`p-5 rounded-2xl border shadow-md border-transparent ${bgGradient}`}>
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
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription_${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download prescription PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const openEdit = (prescription) => {
    setSelected(prescription);
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
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

            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <User size={16} className="text-text-light" /> Patient: {p.patient?.user?.name || 'Unknown Patient'}
              </p>
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <User size={16} className="text-text-light" /> Prescribed By: Dr. {p.doctor?.user?.name || 'Unknown Doctor'}
              </p>
              <p className="text-sm flex items-center gap-2 text-text-muted">
                <Calendar size={16} className="text-text-light" /> Issued On: {new Date(p.created_at).toLocaleDateString()}
              </p>
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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
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

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setEditModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-200">
                <Save size={16} /> Submit Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

