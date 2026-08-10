import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Plus, Search, Archive, Pencil, CheckCircle, AlertCircle } from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const CATEGORIES = [
  'Analgesic', 'Antacid', 'Antibiotic', 'Antidiabetic', 'Antifungal',
  'Antihistamine', 'Antihypertensive', 'Cardiology', 'Corticosteroid',
  'Dermatology', 'Endocrinology', 'Gastroenterology', 'Infectious Disease',
  'NSAID', 'Pediatrics', 'PhilHealth YAKAP', 'PhilHealth GAMOT',
  'Pulmonology', 'Psychiatry', 'Vitamin', 'Other',
];

function BatchManager({ medicine, fetchMedicines }) {
  const [batches, setBatches] = useState(medicine.batches || []);
  const [newBatch, setNewBatch] = useState({ batch_number: '', stock: 0, expiration_date: '' });

  const addBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/medicines/${medicine.id}/batches`, newBatch);
      setBatches(res.data.batches);
      setNewBatch({ batch_number: '', stock: 0, expiration_date: '' });
      toast.success('Batch added');
      fetchMedicines(); // update main list total_stock
    } catch {
      toast.error('Failed to add batch');
    }
  };

  const deleteBatch = async (batchId) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      const res = await api.delete(`/medicines/${medicine.id}/batches/${batchId}`);
      setBatches(res.data.batches);
      toast.success('Batch deleted');
      fetchMedicines();
    } catch {
      toast.error('Failed to delete batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl p-4 border border-border">
        <h4 className="font-medium text-sm text-text mb-3">Existing Batches</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {batches.length === 0 ? <p className="text-sm text-text-light">No batches recorded.</p> : batches.map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 bg-surface rounded-lg border border-border">
              <div>
                <p className="text-sm font-semibold text-text">
                  Batch No: {b.batch_number}
                  {new Date(b.expiration_date) < new Date() && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wide">Pullout</span>
                  )}
                </p>
                <p className="text-xs text-text-light">Exp: {new Date(b.expiration_date).toLocaleDateString()} • Stock: {b.stock} {medicine.dosage_form || 'units'}</p>
              </div>
              <button onClick={() => deleteBatch(b.id)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded bg-danger-bg">Delete</button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-medium text-sm text-text mb-3">Add New Batch</h4>
        <form onSubmit={addBatch} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Batch No.</label>
              <input required type="text" value={newBatch.batch_number} onChange={e=>setNewBatch({...newBatch, batch_number: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-emerald-500/20 text-sm bg-surface" placeholder="e.g. BATCH-01" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Stock</label>
              <input required type="number" min="1" value={newBatch.stock} onChange={e=>setNewBatch({...newBatch, stock: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-emerald-500/20 text-sm bg-surface" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Exp Date</label>
              <input required type="date" value={newBatch.expiration_date} onChange={e=>setNewBatch({...newBatch, expiration_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-emerald-500/20 text-sm bg-surface" />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-emerald-50 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-100 transition-colors text-sm">Add Batch</button>
        </form>
      </div>
    </div>
  );
}

export default function Medicines() {
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editTarget, setEditTarget] = useState(null);
  const [batchTarget, setBatchTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', generic_name: '', category: 'Analgesic', description: '', dosage_form: 'tablets', stock: 0, expiration_date: '', batch_number: '' });
  const [expiryThreshold] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
    } catch {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    api.get('/medicines')
      .then((response) => {
        if (isActive) setMedicines(response.data);
      })
      .catch(() => toast.error('Failed to load medicines'))
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medicines', formData);
      toast.success('Medicine added to database!');
      setIsAddModalOpen(false);
      setFormData({ name: '', generic_name: '', category: 'Analgesic', description: '', dosage_form: 'tablets', stock: 0, expiration_date: '', batch_number: '' });
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/medicines/${editTarget.id}`, editTarget);
      toast.success('Medicine updated!');
      setIsEditModalOpen(false);
      fetchMedicines();
    } catch {
      toast.error('Failed to update medicine');
    }
  };

  const handleDeactivate = async (medicine) => {
    if (!window.confirm(`Deactivate "${medicine.name}"? It will no longer appear in prescriptions.`)) return;
    try {
      await api.delete(`/medicines/${medicine.id}`);
      toast.success('Medicine deactivated');
      fetchMedicines();
    } catch {
      toast.error('Failed to deactivate medicine');
    }
  };

  const getCategoryCount = (cat) => {
    if (cat === 'All') return medicines.length;
    return medicines.filter((m) => (m.category || '').toLowerCase().includes(cat.toLowerCase())).length;
  };

  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || (m.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <PageTitle icon={Pill} title="Medicine Database" description="View and manage available medicines for e-prescriptions." iconClassName="bg-success-bg text-emerald-600" />
        {(user?.role === 'Admin' || user?.role === 'Staff') && (
          <button data-tour="page-primary-action" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 flex-col sm:flex-row items-center justify-between">
          <div data-tour="page-search" className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicines by name or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background focus:bg-surface transition-all text-sm"
            />
          </div>

          {/* Right-side Category Filter Dropdown with live counts */}
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted whitespace-nowrap hidden md:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background focus:bg-surface transition-all text-sm font-medium text-text"
            >
              <option value="All">All Categories ({medicines.length})</option>
              {CATEGORIES.map(c => {
                const count = getCategoryCount(c);
                return (
                  <option key={c} value={c}>
                    {c} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        {!loading && (
          <div className="px-4 py-2.5 bg-surface-hover/30 border-b border-border text-xs text-text-muted">
            Showing <span className="font-semibold text-text">{filtered.length}</span> of <span className="font-semibold text-text">{medicines.length}</span> medicines
          </div>
        )}
        <div className="overflow-x-auto">
          <table data-tour="page-list" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background text-text-muted text-sm border-b border-border">
                <th className="p-4 font-semibold">Medicine Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Total Stock</th>
                <th className="p-4 font-semibold">Expiration / Batch</th>
                <th className="p-4 font-semibold">Status</th>
                {(user?.role === 'Admin' || user?.role === 'Staff') && <th className="p-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-6 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    {(user?.role === 'Admin' || user?.role === 'Staff') && <td className="p-4"><Skeleton className="h-6 w-32 ml-auto" /></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={user?.role === 'Admin' || user?.role === 'Staff' ? 6 : 5} className="p-8 text-center text-text-light">No medicines found.</td></tr>
              ) : filtered.map(m => (
                  <tr key={m.id} className="hover:bg-background/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3 font-medium text-text">
                      <div className="w-8 h-8 rounded-lg bg-success-bg text-emerald-600 flex items-center justify-center shrink-0"><Pill size={16} /></div>
                      <div>
                        <p>{m.name}</p>
                        {m.generic_name && <p className="text-xs text-text-muted italic">{m.generic_name}</p>}
                        {m.description && <p className="text-xs text-text-light font-normal">{m.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-text-muted">{m.category}</td>
                  <td className="p-4">
                    <span className={`font-semibold ${m.total_stock > 10 ? 'text-text' : m.total_stock > 0 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {m.total_stock || 0}
                    </span>
                    <span className="text-xs text-text-muted ml-1">
                      {m.dosage_form ? m.dosage_form : 'units'}
                    </span>
                  </td>
                  <td className="p-4">
                    {m.batches && m.batches.length > 0 ? (
                      <div>
                        {(() => {
                           const today = new Date();
                           today.setHours(0,0,0,0);
                           const activeBatches = m.batches.filter(b => b.stock > 0 && new Date(b.expiration_date) >= today).sort((a,b) => new Date(a.expiration_date) - new Date(b.expiration_date));
                           if (activeBatches.length === 0) {
                             const hasExpired = m.batches.some(b => b.stock > 0 && new Date(b.expiration_date) < today);
                             if (hasExpired) return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wide">PULL OUT (EXPIRED)</span>;
                             return (user?.role === 'Admin' || user?.role === 'Staff')
                               ? <span className="text-rose-500 text-sm font-bold flex items-center gap-1"><AlertCircle size={14} /> NEEDS RESTOCK</span>
                               : <span className="text-text-light text-sm italic">Out of Stock</span>;
                           }
                           const nearest = activeBatches[0];
                           const isNearExpiry = expiryThreshold && new Date(nearest.expiration_date) < expiryThreshold;
                           return (
                             <>
                               <span className={`text-sm flex items-center gap-2 ${isNearExpiry ? 'text-amber-600 font-semibold' : 'text-text-muted'}`}>
                                 <span>Exp: {new Date(nearest.expiration_date).toLocaleDateString()}</span>
                                 {isNearExpiry && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">Near Expiry</span>}
                               </span>
                               <span className="text-xs text-text-light font-medium mt-0.5 block">Batch No: {nearest.batch_number}</span>
                               {activeBatches.length > 1 ? (
                                 <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                   <CheckCircle size={12} /> Backup available ({activeBatches.length - 1})
                                 </span>
                               ) : isNearExpiry ? (
                                 (user?.role === 'Admin' || user?.role === 'Staff')
                                   ? <span className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12} /> NEEDS RESTOCK</span>
                                   : <span className="text-xs text-amber-500 font-semibold mt-1 block">No backup batch</span>
                               ) : null}
                             </>
                           );
                        })()}
                      </div>
                    ) : (
                      <span className="text-text-light text-sm italic">No batches</span>
                    )}
                  </td>
                  <td className="p-4">
                    {m.status ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle size={14} /> Active</span>
                    ) : (
                      <span className="text-text-light text-xs font-semibold flex items-center gap-1.5"><Archive size={14} /> Inactive</span>
                    )}
                  </td>
                  {(user?.role === 'Admin' || user?.role === 'Staff') && (
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setBatchTarget(m); setIsBatchesModalOpen(true); }}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                        >
                          <Pill size={14} /> Batches
                        </button>
                        <button
                          onClick={() => { setEditTarget({ ...m }); setIsEditModalOpen(true); }}
                          className="text-primary-text hover:text-sky-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-bg transition-colors flex items-center gap-1"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        {m.status && (
                          <button
                            onClick={() => handleDeactivate(m)}
                            className="text-rose-500 hover:text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-danger-bg transition-colors flex items-center gap-1"
                          >
                            <Archive size={14} /> Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Medicine">
        <form data-tour="page-form" onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Brand Name</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Generic Name</label>
              <input value={formData.generic_name} onChange={e => setFormData({ ...formData, generic_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none bg-surface">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Unit/Dosage Form</label>
            <input value={formData.dosage_form} onChange={e => setFormData({ ...formData, dosage_form: e.target.value })} placeholder="e.g. tablets, boxes, bottles" className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Description (optional)</label>
            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-sm font-semibold text-text mb-3">Initial Batch (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Batch No.</label>
                <input type="text" value={formData.batch_number} onChange={e => setFormData({ ...formData, batch_number: e.target.value })} placeholder="e.g. BATCH-01" className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20 bg-surface" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Initial Stock</label>
                <input type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20 bg-surface" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Expiration Date</label>
                <input type="date" value={formData.expiration_date} onChange={e => setFormData({ ...formData, expiration_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20 bg-surface" />
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 transition-colors">Save Medicine</button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Medicine Info">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Brand Name</label>
                <input required value={editTarget.name} onChange={e => setEditTarget({ ...editTarget, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Generic Name</label>
                <input value={editTarget.generic_name || ''} onChange={e => setEditTarget({ ...editTarget, generic_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
              <select value={editTarget.category} onChange={e => setEditTarget({ ...editTarget, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none bg-surface">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Unit/Dosage Form</label>
              <input value={editTarget.dosage_form || ''} onChange={e => setEditTarget({ ...editTarget, dosage_form: e.target.value })} placeholder="e.g. tablets, boxes, bottles" className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
              <input value={editTarget.description || ''} onChange={e => setEditTarget({ ...editTarget, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <p className="text-xs text-text-light italic">Note: To edit stock and expiration dates, please use the "Manage Batches" button.</p>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors">Update Medicine</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manage Batches Modal */}
      <Modal isOpen={isBatchesModalOpen} onClose={() => { setIsBatchesModalOpen(false); fetchMedicines(); }} title={`Manage Batches: ${batchTarget?.name}`}>
        {batchTarget && (
           <BatchManager medicine={batchTarget} fetchMedicines={fetchMedicines} />
        )}
      </Modal>
    </div>
  );
}

