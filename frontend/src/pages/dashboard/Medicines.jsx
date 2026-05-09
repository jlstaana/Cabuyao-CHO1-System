
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Plus, Search, Archive } from 'lucide-react';

export default function Medicines() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await api.get('/medicines');
        setMedicines(response.data);
      } catch (err) {
        toast.error('Failed to load medicines');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Medicine Database" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Database</h1>
          <p className="text-slate-500">View and manage the inventory of available medicines.</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Staff') && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search medicines..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white" />
           </div>
         </div>
         <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
              <th className="p-4 font-semibold">Medicine Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Stock Level</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <tr key={i}>
                   <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                   <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                   <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                   <td className="p-4 flex justify-end"><Skeleton className="h-6 w-16" /></td>
                 </tr>
               ))
            ) : medicines.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 flex items-center gap-3 font-medium text-slate-900">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Pill size={16}/></div>
                   {m.name}
                </td>
                <td className="p-4 text-slate-500">{m.category}</td>
                <td className="p-4">
                   <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${m.stock_quantity > 500 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{m.stock_quantity} Units</span>
                </td>
                <td className="p-4 text-right">
                   {(user?.role === 'Admin' || user?.role === 'Staff') ? (
                     <>
                        <button className="text-rose-500 hover:text-rose-700 text-sm font-semibold"><Archive size={16} className="inline mr-1" />Deactivate</button>
                     </>
                   ) : (
                     <span className="text-slate-400 text-sm">View Only</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Medicine">
        <form className="space-y-4">
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Generic / Brand Name</label><input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" /></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white"><option>Antibiotic</option><option>Analgesic</option><option>Vitamins</option></select></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label><input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" /></div>
           <div className="pt-4 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium">Cancel</button>
              <button type="button" className="px-5 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md">Save Medicine</button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
