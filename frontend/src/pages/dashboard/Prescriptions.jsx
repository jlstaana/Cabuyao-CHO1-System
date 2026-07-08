import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { FileText, Download, User, Edit, Plus, Trash2, Save, Calendar } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import Modal from '../../components/Modal';
import useAuthStore from '../../store/useAuthStore';

const emptyItem = { medicine_id: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function Prescriptions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ notes: '', items: [{ ...emptyItem }] });

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
    <div className="animate-in fade-in duration-500">      <div className="flex justify-between items-center mb-6">
        <PageTitle icon={FileText} title="E-Prescriptions" description="Access and manage digitally signed medical prescriptions." iconClassName="bg-success-bg text-emerald-600" />
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
        ) : prescriptions.length === 0 ? (
           <div className="col-span-full p-8 text-center text-text-muted bg-surface rounded-2xl border border-border">No prescriptions found.</div>
        ) : prescriptions.map(p => (
          <div key={p.id} className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-text line-clamp-1">
                {p.notes || 'Prescription Details'}
              </h3>
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
                className="w-full flex items-center justify-center gap-2 bg-background text-slate-700 py-2.5 rounded-xl font-medium hover:bg-success-bg hover:text-success-text transition-colors border border-border hover:border-emerald-200"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Prescription Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Medicines</p>
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
