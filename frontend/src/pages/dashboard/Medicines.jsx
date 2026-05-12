import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Plus, Search, Archive, Pencil, CheckCircle } from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const CATEGORIES = ['Analgesic', 'Antibiotic', 'Antihistamine', 'Vitamins', 'Antacid', 'Antidiabetic', 'Antihypertensive', 'Other'];

export default function Medicines() {
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Analgesic', description: '' });

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
      setFormData({ name: '', category: 'Analgesic', description: '' });
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

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Medicine Database" />
      <div className="flex justify-between items-center mb-6">
        <PageTitle icon={Pill} title="Medicine Database" description="View and manage available medicines for e-prescriptions." iconClassName="bg-emerald-50 text-emerald-600" />
        {(user?.role === 'Admin' || user?.role === 'Staff') && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicines by name or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
              <th className="p-4 font-semibold">Medicine Name</th>
              <th className="p-4 font-semibold">Category</th>
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
                  {(user?.role === 'Admin' || user?.role === 'Staff') && <td className="p-4"><Skeleton className="h-6 w-24 ml-auto" /></td>}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400">No medicines found.</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3 font-medium text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Pill size={16} /></div>
                    <div>
                      <p>{m.name}</p>
                      {m.description && <p className="text-xs text-slate-400 font-normal">{m.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-500">{m.category}</td>
                <td className="p-4">
                  {m.status ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle size={14} /> Active</span>
                  ) : (
                    <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5"><Archive size={14} /> Inactive</span>
                  )}
                </td>
                {(user?.role === 'Admin' || user?.role === 'Staff') && (
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditTarget({ ...m }); setIsEditModalOpen(true); }}
                        className="text-sky-600 hover:text-sky-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors flex items-center gap-1"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      {m.status && (
                        <button
                          onClick={() => handleDeactivate(m)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
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

      {/* Add Medicine Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Medicine">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Generic / Brand Name</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 transition-colors">Save Medicine</button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Medicine">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
              <input required value={editTarget.name} onChange={e => setEditTarget({ ...editTarget, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={editTarget.category} onChange={e => setEditTarget({ ...editTarget, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors">Update Medicine</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
