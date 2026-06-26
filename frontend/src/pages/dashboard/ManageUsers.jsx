import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { UserPlus, Archive, CheckCircle, Search, Copy, RefreshCw, UserCheck } from 'lucide-react';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import PageTitle from '../../components/PageTitle';

// Generates a random temporary password
function generateTempPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const ROLE_STYLES = {
  Admin:   'bg-fuchsia-100 text-fuchsia-700',
  Doctor:  'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400',
  Staff:   'bg-amber-100 text-amber-700 dark:text-amber-400',
  Visitor: 'bg-purple-100 text-purple-700',
  Patient: 'bg-slate-100 dark:bg-zinc-800/50 text-slate-700',
};

const SPECIALIZATION_OPTIONS = [
  'General Medicine',
  'Cardio',
  'Pulmo',
  'Mental',
  'Endo',
];

export default function ManageUsers() {
  const { user } = useAuthStore();
  const [loading, setLoading]         = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCredsOpen, setIsCredsOpen]   = useState(false);
  const [users, setUsers]             = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', user: null });
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'Doctor',
    specialization: 'General Medicine', department: 'Outpatient',
    access_type: 'permanent',          // 'permanent' | 'visiting'
    expires_at: '',
    availability_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    start_time: '08:00',
    end_time: '17:00',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'Admin' && user?.role !== 'Staff') return;
    let isActive = true;
    api.get('/admin/users')
      .then((response) => {
        if (isActive) setUsers(response.data);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, [user]);

  // ── Create user / visiting doctor ─────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    const tmpPass = generateTempPassword();
    try {
      const endpoint = formData.role === 'Doctor' ? '/admin/doctors' : '/admin/staff';
      await api.post(endpoint, { ...formData, password: tmpPass });
      toast.success('Account created successfully!');
      setIsCreateOpen(false);
      setGeneratedCreds({ name: formData.name, email: formData.email, password: tmpPass, role: formData.role, access_type: formData.access_type });
      setIsCredsOpen(true);
      setFormData({ name: '', email: '', role: 'Doctor', specialization: 'General Medicine', department: 'Outpatient', access_type: 'permanent', expires_at: '', availability_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], start_time: '08:00', end_time: '17:00' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // ── Deactivate / archive user ─────────────────────────────────────────────
  const openConfirmModal = (type, u) => {
    setConfirmAction({ type, user: u });
    setIsConfirmOpen(true);
  };

  const executeConfirmAction = async () => {
    const { type, user: u } = confirmAction;
    setIsConfirmOpen(false);

    try {
      if (type === 'archive') {
        await api.patch(`/admin/users/${u.id}/deactivate`);
        toast.success(`${u.name}'s account archived.`);
      } else if (type === 'reactivate') {
        await api.patch(`/admin/users/${u.id}/reactivate`);
        toast.success(`${u.name}'s account reactivated.`);
      }
      fetchUsers();
    } catch {
      toast.error(`Failed to ${type} account`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleAvailabilityDay = (day) => {
    setFormData((current) => ({
      ...current,
      availability_days: current.availability_days.includes(day)
        ? current.availability_days.filter((item) => item !== day)
        : [...current.availability_days, day],
    }));
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== 'Admin' && user?.role !== 'Staff') {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-zinc-500 bg-surface rounded-2xl shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SEO title="Manage Users" description="Health Officer User & Account Management" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <PageTitle icon={UserPlus} title="Account Management" description="Create doctor & staff accounts, assign visiting doctor access, and manage credentials." iconClassName="bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" />
        <div data-tour="page-primary-action" className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFormData(f => ({ ...f, role: 'Doctor', access_type: 'visiting' })); setIsCreateOpen(true); }}
            className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2.5 rounded-xl hover:bg-purple-600 transition-all shadow-md dark:shadow-none shadow-purple-200 font-medium active:scale-95 text-sm"
          >
            <UserCheck size={17} /> Visiting Doctor
          </button>
          <button
            onClick={() => { setFormData(f => ({ ...f, access_type: 'permanent' })); setIsCreateOpen(true); }}
            className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2.5 rounded-xl hover:bg-sky-600 transition-all shadow-md dark:shadow-none shadow-sky-200 font-medium active:scale-95 text-sm"
          >
            <UserPlus size={17} /> Create Account
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface rounded-2xl shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-zinc-800 dark:border-zinc-800 bg-surface flex flex-col md:flex-row gap-4">
           <div data-tour="page-search" className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-background focus:bg-surface transition-all"
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table data-tour="page-list" className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-background/50 text-slate-500 dark:text-zinc-500 text-sm border-b border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
                <th className="px-6 py-4 font-semibold tracking-wide">User Profile</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Role</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Access Type</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">No users found.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-background/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shadow-inner dark:shadow-none">
                           {u.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-semibold text-text group-hover:text-sky-600 dark:text-sky-400 transition-colors">{u.name}</p>
                           <p className="text-sm text-slate-500 dark:text-zinc-500">{u.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ROLE_STYLES[u.role] || ROLE_STYLES.Patient}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.doctor?.doctor_type === 'Visiting' ? (
                        <span className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold bg-purple-50 px-2.5 py-1 rounded-md w-fit">
                          <UserCheck size={13} /> Visiting
                          {u.doctor?.active_until && <span className="text-purple-400 ml-1">· {new Date(u.doctor.active_until).toLocaleDateString()}</span>}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 text-xs font-medium">{u.role === 'Doctor' ? 'Resident' : 'Permanent'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md w-fit"><CheckCircle size={16} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500 text-sm font-semibold bg-slate-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md w-fit"><Archive size={16} /> Archived</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.is_active ? (
                        <button
                          onClick={() => openConfirmModal('archive', u)}
                          className="text-rose-500 dark:text-rose-400 hover:text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-900/30 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Archive size={14} /> Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmModal('reactivate', u)}
                          className="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:bg-emerald-900/30 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle size={14} /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Account Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={formData.access_type === 'visiting' ? 'Assign Visiting Doctor Access' : 'Create New Account'}>
        <form data-tour="page-form" onSubmit={handleCreate} className="space-y-4">
          {/* Access type toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-800/50 rounded-xl mb-2">
            {['permanent','visiting'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData(f => ({ ...f, access_type: t }))}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${formData.access_type === t ? 'bg-surface shadow text-sky-700 dark:text-sky-400' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700'}`}
              >
                {t === 'visiting' ? '🩺 Visiting Doctor' : '🏥 Permanent Staff'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. Doctor Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 focus:ring-2 focus:ring-sky-500/20 outline-none" />
          </div>

          {formData.access_type === 'permanent' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 bg-surface outline-none">
                <option value="Doctor">Doctor</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          )}

          {(formData.role === 'Doctor' || formData.access_type === 'visiting') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <select required value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none">
                {SPECIALIZATION_OPTIONS.map((specialization) => (
                  <option key={specialization} value={specialization}>{specialization}</option>
                ))}
              </select>
            </div>
          )}

          {(formData.role === 'Doctor' || formData.access_type === 'visiting') && (
            <div className="space-y-3 rounded-xl border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 bg-background p-4">
              <label className="block text-sm font-semibold text-slate-700">Consultation Schedule</label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleAvailabilityDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      formData.availability_days.includes(day)
                        ? 'bg-sky-500 text-white'
                        : 'bg-surface text-slate-500 dark:text-zinc-500 border border-slate-300 dark:border-zinc-800 hover:text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 mb-1">Start Time</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 mb-1">End Time</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none" />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'Staff' && formData.access_type === 'permanent' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. Outpatient, Pharmacy" />
            </div>
          )}

          {formData.access_type === 'visiting' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Access Expires On</label>
              <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none" />
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Leave blank for indefinite visiting access.</p>
            </div>
          )}

          <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 rounded-xl px-4 py-3 text-xs text-sky-700 dark:text-sky-400">
            <strong>Note:</strong> A secure temporary password will be auto-generated. Share credentials only through a secure channel.
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-zinc-400 font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-xl flex items-center gap-2">
              <RefreshCw size={15} /> Generate &amp; Create
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Generated Credentials Modal ──────────────────────────────────────── */}
      <Modal isOpen={isCredsOpen} onClose={() => setIsCredsOpen(false)} title="✅ Temporary Credentials Generated">
        {generatedCreds && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Share these credentials with <strong>{generatedCreds.name}</strong> through a secure channel. The user should change their password upon first login.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Full Name',   value: generatedCreds.name },
                { label: 'Email',       value: generatedCreds.email },
                { label: 'Role',        value: `${generatedCreds.role}${generatedCreds.access_type === 'visiting' ? ' (Visiting)' : ''}` },
                { label: 'Temp Password', value: generatedCreds.password, mono: true, sensitive: true },
              ].map(({ label, value, mono, sensitive }) => (
                <div key={label} className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 border ${sensitive ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200' : 'bg-background border-slate-300 dark:border-zinc-800 dark:border-zinc-800'}`}>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</p>
                    <p className={`mt-0.5 text-text font-medium ${mono ? 'font-mono text-sm tracking-widest' : ''}`}>{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value)} className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:bg-sky-900/30 transition-colors shrink-0">
                    <Copy size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setIsCredsOpen(false)} className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title={confirmAction.type === 'archive' ? 'Archive Account' : 'Reactivate Account'}>
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-zinc-400">
            {confirmAction.type === 'archive' ? (
              <>Are you sure you want to archive the account for <strong>{confirmAction.user?.name}</strong>? They will be immediately logged out and lose access to the system until reactivated.</>
            ) : (
              <>Are you sure you want to reactivate the account for <strong>{confirmAction.user?.name}</strong>? They will regain access to their account.</>
            )}
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setIsConfirmOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-zinc-400 font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-xl transition-colors">Cancel</button>
            <button
              onClick={executeConfirmAction}
              className={`px-5 py-2.5 font-medium rounded-xl text-white transition-colors shadow-md dark:shadow-none ${
                confirmAction.type === 'archive'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {confirmAction.type === 'archive' ? 'Yes, Archive Account' : 'Yes, Reactivate Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
