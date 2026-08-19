import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Activity, Users, FileText, HeartPulse, Stethoscope,
  Clock, CheckCircle, Calendar, Pill, BarChart2, ShieldCheck,
  Video, ClipboardList, AlertCircle, ImagePlus,
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
  const rows = consultations.filter((c) => ['Pending', 'Scheduled'].includes(c.status)).slice(0, 5);
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
        {rows.length === 0 ? <p className="text-sm text-text-light">No pending or scheduled consultations.</p> : rows.map((c) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Patients" value={formatNumber(summary.registered_patients)} icon={Users} color="text-indigo-500" sub="Registered individuals" />
        <StatCard label="Total Doctors" value={formatNumber(summary.active_doctors)} icon={Activity} color="text-sky-500" sub="Active healthcare providers" />
        <StatCard label="Total Consultations" value={formatNumber(summary.total_consultations)} icon={ClipboardList} color="text-emerald-500" sub="Year-to-date complete consultations" />
        <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} icon={FileText} color="text-rose-500" sub="Generated prescriptions" />
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
        {patient && <QuickLink to="/vitals" icon={HeartPulse} label="Record Vital Signs" color="text-rose-700"  />}
        {patient && <QuickLink to="/medical-images" icon={ImagePlus} label="Upload Medical Image" color="text-warning-text"  />}
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
  const pending = consultations.filter((c) => c.status === 'Pending').length;
  const scheduledToday = consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length;
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={`Good day, Dr. ${(user?.name?.split(' ')[0] || '').replace(/^Dr\.\s*/i, '')}!`} description="Here's your consultation overview." iconClassName="bg-success-bg text-emerald-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Patient Queue" value={pending} icon={Clock} color="text-amber-500"  sub="Pending requests needing review" />
        <StatCard label="Scheduled Consultations" value={scheduledToday} icon={Calendar} color="text-sky-500"  sub="Upcoming sessions for today" />
        <StatCard label="Recent Prescriptions" value={prescriptions.length} icon={FileText} color="text-indigo-500"  sub="Total generated prescriptions" />
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
  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (d.getTime() + 15 * 60 * 1000) > now.getTime();
  };
  const upcoming = consultations.find((c) => c.status === 'Scheduled' && isUpcoming(c.scheduled_at));
  const vitalEntries = consultations.filter((c) => c.vital_signs || c.vitalSigns).length;
  
  const totalRequests = consultations.length;

  return (
    <>
      <header className="mb-8">
        <PageTitle icon={HeartPulse} title={`Hello, ${user?.name?.split(' ')[0]}!`} description="Here's your health summary and upcoming activities." iconClassName="bg-danger-bg text-danger-text" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Consultations" value={totalRequests} icon={Stethoscope} color="text-sky-500"  sub="Consultation history" />
        <StatCard label="E-Prescriptions" value={prescriptions.length} icon={FileText} color="text-emerald-500"  sub="Generated prescriptions" />
        <StatCard label="Vital Sign Records" value={vitalEntries} icon={HeartPulse} color="text-rose-500"  sub="Recorded health logs" />
        <StatCard label="Upcoming Appointment" value={upcoming?.scheduled_at ? new Date(upcoming.scheduled_at).toLocaleDateString() : 'None'} icon={Calendar} color="text-indigo-500"  sub="Scheduled consultation" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ConsultationQueue consultations={consultations} />
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="font-semibold text-text">Quick Actions</h3>
            <p className="text-xs text-text-light mt-0.5">Frequently used tools and shortcuts.</p>
          </div>
          <div className="space-y-3">
            <QuickLink to="/consultations" icon={Video} label="Request Teleconsult" color="text-primary-text"  />
            <QuickLink to="/vitals" icon={HeartPulse} label="Record Vital Signs" color="text-rose-700"  />
            <QuickLink to="/medical-images" icon={ImagePlus} label="Upload Medical Image" color="text-warning-text"  />
            <QuickLink to="/prescriptions" icon={FileText} label="View Prescriptions" color="text-success-text"  />
          </div>
        </div>
      </div>
      {vitalEntries === 0 && (
        <div className="bg-danger-bg border border-rose-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-800">Vital Signs Reminder</p>
            <p className="text-sm text-danger-text mt-0.5">No vital signs have been recorded yet.</p>
          </div>
          <Link to="/vitals" className="flex-shrink-0 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors">
            Record Now
          </Link>
        </div>
      )}
    </>
  );
}

function StaffOverview({ user, stats, consultations, medicines }) {
  const pending = consultations.filter((c) => c.status === 'Pending').length;
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Users} title="Staff Dashboard" description={`Welcome, ${user?.name}. Here's the current workload.`} iconClassName="bg-warning-bg text-amber-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Pending Requests" value={pending} icon={Clock} color="text-amber-500"  sub="Needs assignment" />
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
    let hasShownError = false;
    const handleError = (msg, fallback) => (err) => {
      console.error(msg, err);
      if (!hasShownError) {
        toast.error('Failed to load dashboard data. Check your connection.');
        hasShownError = true;
      }
      return fallback;
    };

    api.get('/consultations').then((res) => setConsultations(res.data || [])).catch((err) => setConsultations(handleError('Consultations API Error', [])(err)));
    api.get('/prescriptions').then((res) => setPrescriptions(res.data || [])).catch((err) => setPrescriptions(handleError('Prescriptions API Error', [])(err)));
    api.get('/medicines').then((res) => setMedicines(res.data || [])).catch((err) => setMedicines(handleError('Medicines API Error', [])(err)));
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      api.get('/analytics/stats').then((res) => setStats({ ...EMPTY_STATS, ...res.data })).catch((err) => setStats(handleError('Stats API Error', EMPTY_STATS)(err)));
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

