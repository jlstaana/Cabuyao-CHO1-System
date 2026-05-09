const fs = require('fs');
const path = require('path');

const updateFile = (file, content) => {
    fs.writeFileSync(path.join(__dirname, file), content);
};

// 1. ManageUsers.jsx
updateFile('src/pages/dashboard/ManageUsers.jsx', `
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { UserPlus, Archive, CheckCircle, Search, Filter } from 'lucide-react';
import SEO from '../../components/SEO';
import api from '../../utils/api';

export default function ManageUsers() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      fetchUsers();
    }
  }, [user]);

  if (user?.role !== 'Admin' && user?.role !== 'Staff') {
    return <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">You do not have permission to view this page.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SEO title="Manage Users" description="System Administrator User Management" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage System Users</h1>
          <p className="text-slate-500 mt-1">Create and manage accounts for doctors, staff, and patients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl hover:bg-sky-600 transition-all shadow-md shadow-sky-200 font-medium active:scale-95"
        >
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50 focus:bg-white transition-all" />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="px-6 py-4 font-semibold tracking-wide">User Profile</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Role</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
                           {u.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{u.name}</p>
                           <p className="text-sm text-slate-500">{u.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        \${u.role === 'Admin' ? 'bg-fuchsia-100 text-fuchsia-700' : 
                          u.role === 'Doctor' ? 'bg-sky-100 text-sky-700' : 
                          u.role === 'Staff' ? 'bg-amber-100 text-amber-700' : 
                          'bg-slate-100 text-slate-700'}
                      \`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 px-2.5 py-1 rounded-md w-fit"><CheckCircle size={16} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold bg-slate-100 px-2.5 py-1 rounded-md w-fit"><Archive size={16} /> Archived</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-rose-500 hover:text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">Deactivate</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User Account">
        <form className="space-y-4">
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20" /></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label><input type="email" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20" /></div>
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign Role</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20">
                 <option>Doctor</option><option>Staff</option>
              </select>
           </div>
           <div className="pt-4 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={() => {toast.success('User generated successfully!'); setIsModalOpen(false);}} className="px-5 py-2.5 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-xl">Create Account</button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
`);

// 2. Medicines.jsx
updateFile('src/pages/dashboard/Medicines.jsx', `
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
                   <span className={\`px-2.5 py-1 rounded-md text-xs font-bold \${m.stock_quantity > 500 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{m.stock_quantity} Units</span>
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
`);

// 3. Consultations.jsx
updateFile('src/pages/dashboard/Consultations.jsx', `
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { Video, FilePlus, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function Consultations() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await api.get('/consultations');
        setConsultations(res.data);
      } catch (err) {
        toast.error('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Scheduled': return 'bg-sky-100 text-sky-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teleconsultations</h1>
          <p className="text-slate-500">Manage and conduct online patient visits.</p>
        </div>
        {user?.role === 'Patient' && (
          <button className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
            <Calendar size={18} /> Request Consultation
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-48 mb-6" />
                <Skeleton className="h-10 w-full" />
             </div>
           ))
        ) : consultations.length === 0 ? (
           <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">No consultations found.</div>
        ) : consultations.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{c.patient?.user?.name || 'Unknown Patient'}</h3>
              <span className={\`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider \${getStatusColor(c.status)}\`}>
                {c.status}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-slate-600"><Calendar size={16} className="text-slate-400" /> {new Date(c.created_at).toLocaleDateString()}</p>
              {c.scheduled_at && <p className="text-sm flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400" /> {new Date(c.scheduled_at).toLocaleTimeString()}</p>}
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {c.status === 'Scheduled' && (
                <Link to={\`/room/\${c.id}\`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                  <Video size={18} /> Join Call
                </Link>
              )}
              {c.status === 'Completed' && user?.role === 'Doctor' && (
                <Link to={\`/room/\${c.id}\`} className="flex-1 flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-2 rounded-lg font-medium hover:bg-sky-100 transition-colors">
                  <FilePlus size={18} /> E-Prescribe
                </Link>
              )}
              {c.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Staff') && (
                <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                  <CheckCircle size={18} /> Approve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`);
