import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import PageTitle from '../../components/PageTitle';
import {
  Video, Calendar, Clock, CheckCircle, XCircle,
  Stethoscope, FilePlus, AlertCircle, Plus,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  Pending:   { pill: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',   icon: Clock },
  Scheduled: { pill: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-400',     icon: Calendar },
  Completed: { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: CheckCircle },
  Cancelled: { pill: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-300',   icon: XCircle },
};

const TAB_ICON = {
  All: Stethoscope,
  Pending: Clock,
  Scheduled: Calendar,
  Completed: CheckCircle,
  Cancelled: XCircle,
};

const DEFAULT_SPECIALIZATIONS = [
  'General Medicine',
  'Cardio',
  'Pulmo',
  'Mental',
  'Endo',
];

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.pill}`}>
      <Icon size={12} /> {status}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
      <Stethoscope size={36} className="mx-auto mb-3 text-slate-300" />
      <p className="font-semibold text-slate-500">{message}</p>
    </div>
  );
}

// ─── PATIENT VIEW ─────────────────────────────────────────────────────────────
function PatientView({ consultations, loading, onRequest, onReschedule, onCancel }) {
  const tabs = ['All', 'Pending', 'Scheduled', 'Completed'];
  const [tab, setTab] = useState('All');

  const filtered = tab === 'All' ? consultations : consultations.filter(c => c.status === tab);

  return (
    <div className="space-y-6">
      {/* CTA banner */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-lg shadow-sky-200">
        <div>
          <h2 className="text-lg font-bold">Need to see a doctor?</h2>
          <p className="text-sky-100 text-sm mt-0.5">Submit a teleconsultation request and a doctor will be assigned to you.</p>
        </div>
        <button
          onClick={onRequest}
          className="flex items-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-50 transition-colors shadow-sm flex-shrink-0 active:scale-95"
        >
          <Plus size={18} /> Request Teleconsult
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = TAB_ICON[t] || Stethoscope;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-600'}`}
            ><Icon size={14} /> {t}</button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-3" /><div className="h-4 bg-slate-100 rounded w-64" />
          </div>
        )) : filtered.length === 0 ? <EmptyState message={tab === 'All' ? 'No consultations yet.' : `No ${tab.toLowerCase()} consultations.`} />
        : filtered.map(c => {
          const cfg = STATUS[c.status] || STATUS.Pending;
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot} hidden sm:block`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-slate-900">
                    {c.doctor?.user?.name ? `Dr. ${c.doctor.user.name}` : 'Doctor to be assigned'}
                  </p>
                  <StatusPill status={c.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  {c.requested_specialization && <span className="flex items-center gap-1"><Stethoscope size={12} /> {c.requested_specialization}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> Requested: {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={12} /> Scheduled: {new Date(c.scheduled_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {['Pending', 'Scheduled'].includes(c.status) && (
                  <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                    <XCircle size={16} /> Cancel
                  </button>
                )}
                {c.status === 'Scheduled' && (
                  <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-700 rounded-xl text-sm font-semibold hover:bg-sky-100 transition-colors">
                    <Calendar size={16} /> Reschedule
                  </button>
                )}
                {c.status === 'Scheduled' && (
                  <Link to={`/room/${c.id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm">
                    <Video size={16} /> Join Now
                  </Link>
                )}
                {c.status === 'Completed' && (
                  <Link to="/prescriptions" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                    <FilePlus size={16} /> View Rx
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DOCTOR VIEW ──────────────────────────────────────────────────────────────
function DoctorView({ consultations, loading, onAccept, onReschedule, onCancel, availabilityStatus }) {
  const [tab, setTab] = useState('Pending');
  const pending   = consultations.filter(c => c.status === 'Pending');
  const scheduled = consultations.filter(c => c.status === 'Scheduled');
  const completed = consultations.filter(c => c.status === 'Completed');

  const counts = { Pending: pending.length, Scheduled: scheduled.length, Completed: completed.length };
  const filtered = tab === 'Pending' ? pending : tab === 'Scheduled' ? scheduled : completed;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      {availabilityStatus && (
        <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${availabilityStatus.is_available_now ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full ${availabilityStatus.is_available_now ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {availabilityStatus.is_available_now ? 'Active and on schedule now' : 'Active but outside scheduled hours'}
          </div>
          <p className="text-xs font-medium opacity-80">{availabilityStatus.scheduleLabel || 'No fixed schedule set'}</p>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',   value: pending.length,   color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Scheduled', value: scheduled.length, color: 'bg-sky-50 border-sky-200 text-sky-700' },
          { label: 'Completed', value: completed.length, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['Pending', 'Scheduled', 'Completed'].map(t => {
          const Icon = TAB_ICON[t] || Stethoscope;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-600'}`}
            >
              <Icon size={14} /> {t}
              {counts[t] > 0 && t === 'Pending' && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{counts[t]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="font-semibold text-slate-500">No {tab.toLowerCase()} consultations.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                {/* Queue number */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {i + 1}
                </div>
                {/* Patient avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                  {(c.patient?.user?.name || 'P').charAt(0)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{c.patient?.user?.name || 'Unknown Patient'}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(c.created_at).toLocaleDateString()}</span>
                    {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={11} /> {new Date(c.scheduled_at).toLocaleString()}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.status === 'Pending' && (
                    <>
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                        Awaiting doctor
                      </span>
                      <button onClick={() => onAccept(c)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                        <CheckCircle size={15} /> Accept
                      </button>
                    </>
                  )}
                  {c.status === 'Scheduled' && (
                    <>
                      <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl text-sm font-semibold hover:bg-sky-100 transition-colors">
                        <Calendar size={15} /> Reschedule
                      </button>
                      <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                        <XCircle size={15} /> Cancel
                      </button>
                      <Link to={`/room/${c.id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm">
                        <Video size={16} /> Join Call
                      </Link>
                    </>
                  )}
                  {c.status === 'Completed' && (
                    <Link to="/prescriptions" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                      <FilePlus size={16} /> E-Prescribe
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN / STAFF VIEW ───────────────────────────────────────────────────────
function AdminView({ consultations, loading, onReschedule, onCancel }) {
  const [tab, setTab] = useState('Scheduled');
  const filtered = consultations.filter(c => c.status === tab);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Pending','Scheduled','Completed','Cancelled'].map(s => {
          const cfg = STATUS[s];
          return (
            <div key={s} className={`rounded-2xl border p-4 ${cfg.pill} bg-opacity-40`}>
              <p className="text-2xl font-black">{consultations.filter(c => c.status === s).length}</p>
              <p className="text-xs font-semibold mt-1 opacity-80">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Pending','Scheduled','Completed','Cancelled'].map(t => {
          const Icon = TAB_ICON[t] || Stethoscope;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-600'}`}
            ><Icon size={14} /> {t} ({consultations.filter(c => c.status === t).length})</button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-500">No {tab.toLowerCase()} consultations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor Assigned</th>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-5 py-3 font-semibold">Scheduled</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(c.patient?.user?.name || 'P').charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800">{c.patient?.user?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {c.doctor?.user?.name ? `Dr. ${c.doctor.user.name}` : <span className="text-slate-300 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-400">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {c.status === 'Pending' && (
                        <span className="text-xs text-slate-400 italic">Doctor-managed</span>
                      )}
                      {c.status === 'Scheduled' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors">
                            <Calendar size={13} /> Reschedule
                          </button>
                          <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                            <XCircle size={13} /> Cancel
                          </button>
                          <Link to={`/room/${c.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                            <Video size={13} /> Monitor
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Consultations() {
  const { user } = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ doctor_id: '', scheduled_at: '' });
  const [specializations, setSpecializations] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [requestForm, setRequestForm] = useState({ requested_specialization: '', scheduled_at: '' });

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      setConsultations(res.data);
    } catch { toast.error('Failed to load consultations'); }
    finally   { setLoading(false); }
  };

  useEffect(() => {
    let isActive = true;
    api.get('/consultations')
      .then(res => {
        if (isActive) setConsultations(res.data);
      })
      .catch(() => toast.error('Failed to load consultations'))
      .finally(() => {
        if (isActive) setLoading(false);
      });
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      api.get('/admin/users')
        .then(res => {
          if (isActive) setDoctors(res.data.filter(u => u.role === 'Doctor'));
        })
        .catch(console.error);
    }
    if (user?.role === 'Patient') {
      api.get('/doctors/specializations')
        .then(res => {
          if (isActive) {
            const rows = res.data || [];
            setSpecializations(rows);
            const options = Array.from(new Set([...DEFAULT_SPECIALIZATIONS, ...rows]));
            setSpecializations(options);
            setRequestForm((form) => ({ ...form, requested_specialization: form.requested_specialization || options[0] || 'General Medicine' }));
          }
        })
        .catch(() => {
          if (isActive) setSpecializations(DEFAULT_SPECIALIZATIONS);
        });
    }
    if (user?.role === 'Patient' || user?.role === 'Doctor') {
      api.get('/doctors/available')
        .then(res => {
          if (isActive) setAvailableDoctors(res.data || []);
        })
        .catch(console.error);
    }
    return () => { isActive = false; };
  }, [user]);

  const handleRequest = () => {
    setRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/consultations/request', requestForm);
      toast.success(response.data?.doctor_id ? 'Consultation scheduled with an available doctor!' : 'Request submitted for an available doctor to accept.');
      setRequestModal(false);
      fetchConsultations();
    } catch { toast.error('Failed to request consultation'); }
  };

  const handleReschedule = (c) => {
    setSelected(c);
    setRescheduleForm({
      doctor_id: c.doctor_id || c.doctor?.id || '',
      scheduled_at: c.scheduled_at ? new Date(c.scheduled_at).toISOString().slice(0, 16) : '',
    });
    setRescheduleModal(true);
  };

  const handleAccept = async (c) => {
    try {
      await api.post(`/consultations/${c.id}/status`, {
        status: 'Scheduled',
        scheduled_at: c.scheduled_at || new Date().toISOString().slice(0, 16),
      });
      toast.success('Consultation accepted and scheduled.');
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept consultation');
    }
  };

  const handleCancel = async (c) => {
    if (!window.confirm(`Cancel consultation for ${c.patient?.user?.name || 'this patient'}?`)) return;
    try {
      await api.post(`/consultations/${c.id}/status`, { status: 'Cancelled' });
      toast.success('Consultation cancelled.');
      fetchConsultations();
    } catch {
      toast.error('Failed to cancel consultation');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/consultations/${selected.id}/status`, {
        status: 'Scheduled',
        ...rescheduleForm,
      });
      toast.success('Consultation rescheduled!');
      setRescheduleModal(false);
      fetchConsultations();
    } catch {
      toast.error('Failed to reschedule consultation');
    }
  };

  // Page title per role
  const titles = {
    Patient: { h1: 'My Consultations', sub: 'Track your requests and join your scheduled teleconsultation.' },
    Doctor:  { h1: 'Consultation Queue', sub: 'Review incoming requests and manage your patient sessions.' },
    Admin:   { h1: 'All Consultations', sub: 'Monitor doctor-managed schedules and consultation sessions.' },
    Staff:   { h1: 'All Consultations', sub: 'Monitor doctor-managed schedules and consultation sessions.' },
  };
  const title = titles[user?.role] || titles.Patient;
  const currentDoctorStatus = availableDoctors.find((doctor) => doctor.user_id === user?.id);
  const currentDoctorAvailability = currentDoctorStatus ? {
    ...currentDoctorStatus,
    scheduleLabel: currentDoctorStatus.availability?.length
      ? currentDoctorStatus.availability.map((slot) => `${slot.day_of_week.slice(0, 3)} ${slot.start_time}-${slot.end_time}`).join(', ')
      : 'Available without fixed schedule',
  } : null;
  const matchingAvailableDoctors = availableDoctors.filter((doctor) => doctor.specialization === requestForm.requested_specialization);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <SEO title={title.h1} description={title.sub} />

      <header>
        <PageTitle icon={Stethoscope} title={title.h1} description={title.sub} iconClassName="bg-sky-50 text-sky-600" />
      </header>

      {user?.role === 'Patient' && <PatientView consultations={consultations} loading={loading} onRequest={handleRequest} onReschedule={handleReschedule} onCancel={handleCancel} />}
      {user?.role === 'Doctor'  && <DoctorView consultations={consultations} loading={loading} onAccept={handleAccept} onReschedule={handleReschedule} onCancel={handleCancel} availabilityStatus={currentDoctorAvailability} />}
      {(user?.role === 'Admin' || user?.role === 'Staff') && (
        <AdminView consultations={consultations} loading={loading} onReschedule={handleReschedule} onCancel={handleCancel} />
      )}

      {/* Patient Request Modal */}
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Teleconsultation">
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Choose the care specialization and preferred schedule. Active doctors can accept your request when they are on schedule.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Needed Specialization</label>
            <select
              required
              value={requestForm.requested_specialization}
              onChange={e => setRequestForm({ ...requestForm, requested_specialization: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              {specializations.length === 0 && <option value="General Medicine">General Medicine</option>}
              {specializations.map((specialization) => (
                <option key={specialization} value={specialization}>{specialization}</option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Doctor Availability</p>
            <div className="space-y-2">
              {matchingAvailableDoctors.length === 0 ? (
                <p className="text-sm text-slate-400">No active doctors listed for this specialization.</p>
              ) : matchingAvailableDoctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Dr. {doctor.name}</p>
                    <p className="text-xs text-slate-400">{doctor.specialization}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${doctor.is_available_now ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${doctor.is_available_now ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {doctor.is_available_now ? 'Available now' : 'Off schedule'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date &amp; Time</label>
            <input
              required
              type="datetime-local"
              value={requestForm.scheduled_at}
              onChange={e => setRequestForm({ ...requestForm, scheduled_at: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setRequestModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-semibold hover:bg-sky-600 rounded-xl flex items-center gap-2 shadow-md shadow-sky-200">
              <Stethoscope size={16} /> Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Reschedule Consultation">
        {selected && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                {(selected.patient?.user?.name || 'P').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selected.patient?.user?.name || 'Patient'}</p>
                <p className="text-xs text-slate-400">
                  Current schedule: {selected.scheduled_at ? new Date(selected.scheduled_at).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
            {(user?.role === 'Admin' || user?.role === 'Staff') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Doctor</label>
                <select required value={rescheduleForm.doctor_id} onChange={e => setRescheduleForm({ ...rescheduleForm, doctor_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 outline-none">
                  <option value="">Select a doctor...</option>
                  {doctors.map(d => <option key={d.doctor?.id} value={d.doctor?.id}>Dr. {d.name}</option>)}
                </select>
              </div>
            )}
            {user?.role === 'Patient' && (
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Your requested schedule will update this consultation. CHO staff or your assigned doctor may still confirm final availability.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Date &amp; Time</label>
              <input required type="datetime-local" value={rescheduleForm.scheduled_at}
                onChange={e => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setRescheduleModal(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-semibold hover:bg-sky-600 rounded-xl flex items-center gap-2 shadow-md shadow-sky-200">
                <Calendar size={16} /> Save Schedule
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
