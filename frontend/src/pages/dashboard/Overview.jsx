import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Activity, Users, User, FileText, HeartPulse, Stethoscope,
  Clock, CheckCircle, Calendar, Pill, BarChart2, ShieldCheck,
  Video, ClipboardList, AlertCircle, ImagePlus, XCircle,
} from 'lucide-react';
import Footer from '../../components/Footer';
import PageTitle from '../../components/PageTitle';

const EMPTY_STATS = {
  summary: {},
  time_based_volume: [],
  recent_logs: [],
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const todayKey = new Date().toDateString();

function isToday(value) {
  return value && new Date(value).toDateString() === todayKey;
}

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

function QuickLink({ to, icon: Icon, label, color, bg }) {
  return (
    <Link to={to} className={`flex items-center gap-3 p-4 rounded-xl border hover:shadow-sm dark:hover:shadow-none transition-all font-medium text-sm ${bg} border-transparent hover:border-border dark:hover:border-zinc-800 ${color}`}>
      <Icon size={20} className={color} />
      {label}
    </Link>
  );
}

function ActivityItem({ dot, label, time }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${dot}`} />
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-light mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function EmptyPanel({ label }) {
  return (
    <div className="h-40 flex items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-text-light">
      {label}
    </div>
  );
}

function VolumePanel({ stats }) {
  const max = Math.max(...stats.time_based_volume.map((row) => Number(row.count || 0)), 1);
  return (
    <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
      <div className="mb-5">
        <h3 className="font-semibold text-text">7-Day Consultation Trend</h3>
        <p className="text-xs text-text-light mt-1">Number of consultation requests over the past 7 active days. Provides an overview of patient influx.</p>
      </div>
      {stats.time_based_volume.length === 0 ? <EmptyPanel label="No consultation volume yet" /> : (
        <div className="space-y-3">
          {stats.time_based_volume.slice(-7).map((row) => (
            <div key={row.date} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-28">{row.date}</span>
              <div className="h-2.5 flex-1 bg-surface-hover/50 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(Number(row.count || 0) / max) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-text-muted w-8 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ stats }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
      <div className="mb-5">
        <h3 className="font-semibold text-text">Recent Activity</h3>
        <p className="text-xs text-text-light mt-1">Latest system actions tracked for auditing purposes.</p>
      </div>
      <div className="space-y-4">
        {stats.recent_logs?.length ? stats.recent_logs.slice(0, 4).map((log, index) => (
          <ActivityItem
            key={`${log.created_at}-${index}`}
            dot="bg-sky-500"
            label={log.action}
            time={log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
          />
        )) : <p className="text-sm text-text-light">No recent activity.</p>}
      </div>
    </div>
  );
}

function ConsultationQueue({ consultations, className = "lg:col-span-2" }) {
  const scheduled = consultations.filter((c) => c.status === 'Scheduled');

  // Interleaved Priority and Regular queue sorting
  const priorityGroup = [];
  const regularGroup = [];

  scheduled.forEach(c => {
    const isPWD = Boolean(c.patient?.category?.includes('PWD'));
    const calcAge = (dob) => {
      if (!dob) return 0;
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };
    const isSenior = Boolean(c.patient?.category?.includes('Senior') || (c.patient?.dob && calcAge(c.patient?.dob) >= 60));
    
    if (isPWD || isSenior) {
      priorityGroup.push(c);
    } else {
      regularGroup.push(c);
    }
  });

  const sortByDate = (a, b) => new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
  priorityGroup.sort(sortByDate);
  regularGroup.sort(sortByDate);

  const interleaved = [];
  let pIdx = 0;
  let rIdx = 0;
  while (pIdx < priorityGroup.length || rIdx < regularGroup.length) {
    if (pIdx < priorityGroup.length) interleaved.push(priorityGroup[pIdx++]);
    if (rIdx < regularGroup.length) interleaved.push(regularGroup[rIdx++]);
  }

  const rows = interleaved.slice(0, 5);
  return (
    <div data-tour="page-list" className={`${className} bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><Stethoscope size={18} /></div>
        <div>
          <h3 className="font-semibold text-text">Consultation Queue</h3>
          <p className="text-xs text-text-light mt-0.5">Patients currently waiting for or scheduled for a teleconsultation.</p>
        </div>
      </div>
      <div className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-text-light">No scheduled consultations.</p> : rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-background transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-bg text-indigo-600 flex items-center justify-center font-bold text-sm">
                {(c.patient?.user?.name || 'P').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text text-sm">{c.patient?.user?.name || 'Patient'}</p>
                <p className="text-xs text-text-light flex items-center gap-1">
                  <Clock size={10} /> {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'Scheduled' ? 'bg-primary-hover text-primary-text' : 'bg-amber-100 text-warning-text'}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminOverview({ user, stats }) {
  const summary = stats.summary || {};
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={ShieldCheck} title="Health Officer Dashboard" description={`Welcome, ${user?.name}. Here's the current system overview.`} iconClassName="bg-primary-bg text-primary-text" />
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard label="Total Patients" value={formatNumber(summary.registered_patients)} icon={Users} color="text-indigo-500" sub="Registered individuals" />
        <StatCard label="Total Doctors" value={formatNumber(summary.active_doctors)} icon={Activity} color="text-sky-500" sub="Active healthcare providers" />
        <StatCard label="Total Consultations" value={formatNumber(summary.total_consultations)} icon={ClipboardList} color="text-blue-500" sub="Requested this month" />
        <StatCard label="Completed Consults" value={formatNumber(summary.completed_consultations)} icon={CheckCircle} color="text-emerald-500" sub="Completed this month" />
        <StatCard label="Cancelled Consults" value={formatNumber(summary.cancelled_consultations)} icon={XCircle} color="text-amber-500" sub="Cancelled / Missed this month" />
        <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} icon={FileText} color="text-rose-500" sub="Issued this month" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <VolumePanel stats={stats} />
        <RecentActivity stats={stats} />
      </div>
      <QuickActions admin />
    </>
  );
}

function QuickActions({ admin = false, patient = false }) {
  return (
    <div data-tour="page-actions" className="bg-surface rounded-2xl shadow-sm border border-border p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="p-2 bg-primary-bg text-primary-text rounded-lg"><ShieldCheck size={18} /></div>
        <div>
          <h3 className="font-semibold text-text">Quick Actions</h3>
          <p className="text-xs text-text-light mt-0.5">Frequently used tools and shortcuts.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {admin && <QuickLink to="/users" icon={Users} label="Manage Users" color="text-primary-text"  />}
        <QuickLink to="/medicines" icon={Pill} label="Medicine List" color="text-success-text"  />
        {admin && <QuickLink to="/analytics" icon={BarChart2} label="View Reports" color="text-brand-text"  />}
        <QuickLink to="/consultations" icon={ClipboardList} label="Consultations" color="text-rose-700"  />
        {patient && <QuickLink to="/profile" icon={User} label="My Profile" color="text-primary-text"  />}
        {patient && <QuickLink to="/medical-images" icon={ImagePlus} label="Medical Files" color="text-warning-text"  />}
      </div>
    </div>
  );
}

function DoctorToDoList({ consultations }) {
  const tasks = [];
  consultations.filter(c => c.status === 'Pending').forEach(c => {
    tasks.push({ id: `p-${c.id}`, text: `Review pending request from ${c.patient?.user?.name || 'Patient'}`, type: 'pending', link: '/consultations' });
  });
  consultations.filter(c => c.status === 'Scheduled' && isToday(c.scheduled_at)).forEach(c => {
    tasks.push({ id: `s-${c.id}`, text: `Consultation with ${c.patient?.user?.name || 'Patient'} today`, type: 'scheduled', link: '/consultations' });
  });

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
      <div className="mb-5 flex items-start gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={18} /></div>
        <div>
          <h3 className="font-semibold text-text">To-Do List</h3>
          <p className="text-xs text-text-light mt-0.5">Actionable items requiring your attention.</p>
        </div>
      </div>
      <div className="space-y-3 flex-1">
        {tasks.length === 0 ? <EmptyPanel label="You're all caught up!" /> : tasks.slice(0, 5).map(t => (
          <Link key={t.id} to={t.link} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-background transition-colors group">
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${t.type === 'pending' ? 'border-amber-400' : 'border-sky-400'}`}>
               <div className={`w-2 h-2 rounded-full hidden group-hover:block ${t.type === 'pending' ? 'bg-amber-400' : 'bg-sky-400'}`} />
            </div>
            <p className="text-sm font-medium text-text group-hover:text-primary-text transition-colors">{t.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DoctorOverview({ user, consultations, prescriptions }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const doctorConsultations = consultations.filter(c => c.doctor_id === user?.doctor?.id);
  
  // Filter doctor's work for the current calendar month
  const monthlyConsultations = doctorConsultations.filter(c => {
    const d = new Date(c.scheduled_at || c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const completedCount = monthlyConsultations.filter(c => c.status === 'Completed').length;
  const cancelledCount = monthlyConsultations.filter(c => c.status === 'Cancelled' || c.status === 'Missed').length;

  const monthlyPrescriptions = prescriptions.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={`Good day, Dr. ${(user?.name || '').replace(/^Dr\.\s*/i, '').trim().split(' ')[0]}!`} description="Here's your consultation overview." iconClassName="bg-success-bg text-emerald-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Scheduled Sessions" value={doctorConsultations.filter(c => c.status === 'Scheduled').length} icon={Calendar} color="text-sky-500" sub="Upcoming appointments" />
        <StatCard label="Completed Sessions" value={completedCount} icon={CheckCircle} color="text-emerald-500" sub="Completed this month" />
        <StatCard label="Cancelled Sessions" value={cancelledCount} icon={XCircle} color="text-amber-500" sub="Cancelled / Missed this month" />
        <StatCard label="Recent Prescriptions" value={monthlyPrescriptions.length} icon={FileText} color="text-indigo-500" sub="Issued this month" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DoctorToDoList consultations={consultations} />
        <ConsultationQueue consultations={consultations} className="lg:col-span-1" />
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="font-semibold text-text">Quick Actions</h3>
            <p className="text-xs text-text-light mt-0.5">Frequently used tools and shortcuts.</p>
          </div>
          <div className="space-y-3">
            <QuickLink to="/consultations" icon={Video} label="Start Teleconsultation" color="text-brand-text"  />
            <QuickLink to="/prescriptions" icon={FileText} label="Create E-Prescription" color="text-success-text"  />
            <QuickLink to="/medicines" icon={Pill} label="Browse Medicines" color="text-primary-text"  />
            <QuickLink to="/patient-records" icon={ClipboardList} label="Patient Records" color="text-warning-text"  />
          </div>
        </div>
      </div>
    </>
  );
}

function PatientOverview({ user, consultations, prescriptions }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const nowTime = new Date();
    return (d.getTime() + 15 * 60 * 1000) > nowTime.getTime();
  };

  const upcoming = consultations.find((c) => c.status === 'Scheduled' && isUpcoming(c.scheduled_at));

  // Filter patient's consultations and prescriptions for the current calendar month
  const monthlyConsultations = consultations.filter(c => {
    const d = new Date(c.scheduled_at || c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const completedCount = monthlyConsultations.filter((c) => c.status === 'Completed').length;
  const cancelledCount = monthlyConsultations.filter((c) => c.status === 'Cancelled' || c.status === 'Missed').length;
  const totalRequests = monthlyConsultations.length;

  const monthlyPrescriptions = prescriptions.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={`Hello, ${user?.name?.split(' ')[0]}!`} description="Here's your health summary and upcoming activities." iconClassName="bg-primary-bg text-primary-text" />
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard label="Total Consultations" value={totalRequests} icon={Stethoscope} color="text-sky-500" sub="Requested this month" />
        <StatCard label="Completed Sessions" value={completedCount} icon={CheckCircle} color="text-emerald-500" sub="Completed this month" />
        <StatCard label="Cancelled Sessions" value={cancelledCount} icon={XCircle} color="text-rose-500" sub="Cancelled / Missed this month" />
        <StatCard label="Active Prescriptions" value={monthlyPrescriptions.length} icon={FileText} color="text-amber-500" sub="Issued this month" />
        <StatCard label="Upcoming Appointment" value={upcoming?.scheduled_at ? new Date(upcoming.scheduled_at).toLocaleDateString() : 'None'} icon={Calendar} color="text-indigo-500" sub="Next scheduled visit" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ConsultationQueue consultations={consultations} />
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="font-semibold text-text">Quick Actions</h3>
            <p className="text-xs text-text-light mt-0.5">Frequently used tools and shortcuts.</p>
          </div>
          <div className="space-y-3">
            <QuickLink to="/consultations" icon={Video} label="Book Consultation" color="text-primary-text" />
            <QuickLink to="/profile" icon={User} label="My Profile & PWD Status" color="text-brand-text" />
            <QuickLink to="/medical-images" icon={ImagePlus} label="Upload Medical Files & IDs" color="text-warning-text" />
            <QuickLink to="/prescriptions" icon={FileText} label="View Prescriptions" color="text-success-text" />
          </div>
        </div>
      </div>
    </>
  );
}

function StaffOverview({ user, stats, consultations, medicines }) {
  
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Users} title="Staff Dashboard" description={`Welcome, ${user?.name}. Here's the current workload.`} iconClassName="bg-warning-bg text-amber-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <StatCard label="Active Patients" value={formatNumber(stats.summary?.registered_patients)} icon={Users} color="text-sky-500"  sub="Registered accounts" />
        <StatCard label="Active Medicines" value={medicines.filter((m) => m.status).length} icon={AlertCircle} color="text-emerald-500"  sub="In-stock inventory" />
        <StatCard label="Scheduled Today" value={consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length} icon={Calendar} color="text-emerald-500"  sub="Upcoming sessions" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity stats={stats} />
        <QuickActions admin />
      </div>
    </>
  );
}

export default function Overview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    if (!user?.role) return;

    let hasShownError = false;
    const handleError = (msg, fallback) => (err) => {
      console.error(msg, err);
      if (!hasShownError) {
        toast.error('Failed to load dashboard data. Check your connection.');
        hasShownError = true;
      }
      return fallback;
    };

    const role = user.role;

    if (role === 'Admin') {
      api.get('/analytics/stats')
        .then((res) => setStats({ ...EMPTY_STATS, ...res.data }))
        .catch((err) => setStats(handleError('Stats API Error', EMPTY_STATS)(err)));
    } else if (role === 'Staff') {
      api.get('/analytics/stats')
        .then((res) => setStats({ ...EMPTY_STATS, ...res.data }))
        .catch((err) => setStats(handleError('Stats API Error', EMPTY_STATS)(err)));
      api.get('/consultations?show_all=1')
        .then((res) => setConsultations(res.data || []))
        .catch((err) => setConsultations(handleError('Consultations API Error', [])(err)));
      api.get('/medicines')
        .then((res) => setMedicines(res.data || []))
        .catch((err) => setMedicines(handleError('Medicines API Error', [])(err)));
    } else if (role === 'Doctor' || role === 'Patient') {
      api.get('/consultations')
        .then((res) => setConsultations(res.data || []))
        .catch((err) => setConsultations(handleError('Consultations API Error', [])(err)));
      api.get('/prescriptions')
        .then((res) => setPrescriptions(res.data || []))
        .catch((err) => setPrescriptions(handleError('Prescriptions API Error', [])(err)));
    }
  }, [user]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {user?.role === 'Admin' && <AdminOverview user={user} stats={stats} />}
      {user?.role === 'Doctor' && <DoctorOverview user={user} consultations={consultations} prescriptions={prescriptions} />}
      {user?.role === 'Patient' && <PatientOverview user={user} consultations={consultations} prescriptions={prescriptions} />}
      {user?.role === 'Staff' && <StaffOverview user={user} stats={stats} consultations={consultations} medicines={medicines} />}
      <Footer className="mt-10 overflow-hidden rounded-2xl" />
    </div>
  );
}

