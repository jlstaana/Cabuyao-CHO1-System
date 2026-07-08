import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Plus, Search, Archive, Pencil, CheckCircle } from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const CATEGORIES = [
  'Analgesic',
  'Antacid',
  'Antibiotic',
  'Antidiabetic',
  'Antifungal',
  'Antihistamine',
  'Antihypertensive',
  'Cardiology',
  'Corticosteroid',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Infectious Disease',
  'NSAID',
  'Pediatrics',
  'PhilHealth YAKAP',
  'PhilHealth GAMOT',
  'Pulmonology',
  'Psychiatry',
  'Vitamin',
  'Other',
];

export default function Medicines() {
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', generic_name: '', category: 'Analgesic', description: '', stock: 0, expiration_date: '' });
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
      setFormData({ name: '', generic_name: '', category: 'Analgesic', description: '', stock: 0, expiration_date: '' });
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

  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || (m.category || '').includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-in fade-in duration-500">      <div className="flex justify-between items-center mb-6">
        <PageTitle icon={Pill} title="Medicine Database" description="View and manage available medicines for e-prescriptions." iconClassName="bg-success-bg text-emerald-600" />
        {(user?.role === 'Admin' || user?.role === 'Staff') && (
          <button data-tour="page-primary-action" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 flex-col sm:flex-row">
          <div data-tour="page-search" className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicines by name or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background focus:bg-surface transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-background focus:bg-surface transition-all sm:w-64"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table data-tour="page-list" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background text-text-muted text-sm border-b border-border">
                <th className="p-4 font-semibold">Medicine Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Expiration</th>
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
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    {(user?.role === 'Admin' || user?.role === 'Staff') && <td className="p-4"><Skeleton className="h-6 w-24 ml-auto" /></td>}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={user?.role === 'Admin' || user?.role === 'Staff' ? 4 : 3} className="p-8 text-center text-text-light">No medicines found.</td></tr>
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
                    <span className={`font-semibold ${m.stock > 10 ? 'text-text' : m.stock > 0 ? 'text-amber-600' : 'text-rose-500'}`}>
                      {m.stock || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    {m.expiration_date ? (
                      <span className={`text-sm ${expiryThreshold && new Date(m.expiration_date) < expiryThreshold ? 'text-rose-500 font-semibold' : 'text-text-muted'}`}>
                        {new Date(m.expiration_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-text-light text-sm italic">N/A</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
              <input value={formData.generic_name} onChange={e => setFormData({ ...formData, generic_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none bg-surface">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
              <input type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20 bg-surface" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
              <input type="date" value={formData.expiration_date} onChange={e => setFormData({ ...formData, expiration_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-emerald-500/20 bg-surface" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 transition-colors">Save Medicine</button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Medicine">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
                <input required value={editTarget.name} onChange={e => setEditTarget({ ...editTarget, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Generic Name</label>
                <input value={editTarget.generic_name || ''} onChange={e => setEditTarget({ ...editTarget, generic_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={editTarget.category} onChange={e => setEditTarget({ ...editTarget, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none bg-surface">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                <input type="number" min="0" value={editTarget.stock || 0} onChange={e => setEditTarget({ ...editTarget, stock: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20 bg-surface" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                <input type="date" value={editTarget.expiration_date || ''} onChange={e => setEditTarget({ ...editTarget, expiration_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-sky-500/20 bg-surface" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors">Update Medicine</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
