import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import {
  Activity, Users, FileText, TrendingUp, HeartPulse, Stethoscope,
  Clock, CheckCircle, Calendar, Pill, BarChart2, ShieldCheck,
  Video, ClipboardList, AlertCircle, ImagePlus,
} from 'lucide-react';
import SEO from '../../components/SEO';
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

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${bg} ${color}`}><Icon size={24} /></div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, color, bg }) {
  return (
    <Link to={to} className={`flex items-center gap-3 p-4 rounded-xl border hover:shadow-sm transition-all font-medium text-sm ${bg} border-transparent hover:border-slate-200 ${color}`}>
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
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function EmptyPanel({ label }) {
  return (
    <div className="h-40 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
      {label}
    </div>
  );
}

function VolumePanel({ stats }) {
  const max = Math.max(...stats.time_based_volume.map((row) => Number(row.count || 0)), 1);
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Consultation Volume Trends</h3>
      {stats.time_based_volume.length === 0 ? <EmptyPanel label="No consultation volume yet" /> : (
        <div className="space-y-3">
          {stats.time_based_volume.slice(-7).map((row) => (
            <div key={row.date} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28">{row.date}</span>
              <div className="h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(Number(row.count || 0) / max) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-700 w-8 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ stats }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {stats.recent_logs?.length ? stats.recent_logs.slice(0, 4).map((log, index) => (
          <ActivityItem
            key={`${log.created_at}-${index}`}
            dot="bg-sky-500"
            label={log.action}
            time={log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
          />
        )) : <p className="text-sm text-slate-400">No recent activity.</p>}
      </div>
    </div>
  );
}

function ConsultationQueue({ consultations }) {
  const rows = consultations.filter((c) => ['Pending', 'Scheduled'].includes(c.status)).slice(0, 5);
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Stethoscope size={16} className="text-sky-500" /> Consultation Queue</h3>
      <div className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-400">No pending or scheduled consultations.</p> : rows.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {(c.patient?.user?.name || 'P').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{c.patient?.user?.name || 'Patient'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'Scheduled' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
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
      <SEO title="Dashboard" description="Health Officer administration overview" />
      <header className="mb-8">
        <PageTitle icon={ShieldCheck} title="Health Officer Dashboard" description={`Welcome, ${user?.name}. Here's the current system overview.`} iconClassName="bg-sky-50 text-sky-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Consultations" value={formatNumber(summary.total_consultations)} icon={Activity} color="text-sky-500" bg="bg-sky-100" />
        <StatCard label="Active Patients" value={formatNumber(summary.registered_patients)} icon={Users} color="text-indigo-500" bg="bg-indigo-100" />
        <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} icon={FileText} color="text-emerald-500" bg="bg-emerald-100" />
        <StatCard label="Completion Rate" value={`${summary.completion_rate || 0}%`} icon={TrendingUp} color="text-rose-500" bg="bg-rose-100" />
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-sky-500" /> Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {admin && <QuickLink to="/users" icon={Users} label="Manage Users" color="text-sky-700" bg="bg-sky-50" />}
        <QuickLink to="/medicines" icon={Pill} label="Medicine List" color="text-emerald-700" bg="bg-emerald-50" />
        {admin && <QuickLink to="/analytics" icon={BarChart2} label="View Reports" color="text-indigo-700" bg="bg-indigo-50" />}
        <QuickLink to="/consultations" icon={ClipboardList} label="Consultations" color="text-rose-700" bg="bg-rose-50" />
        {patient && <QuickLink to="/vitals" icon={HeartPulse} label="Record Vital Signs" color="text-rose-700" bg="bg-rose-50" />}
        {patient && <QuickLink to="/medical-images" icon={ImagePlus} label="Upload Medical Image" color="text-amber-700" bg="bg-amber-50" />}
      </div>
    </div>
  );
}

function DoctorOverview({ user, consultations, prescriptions }) {
  const pending = consultations.filter((c) => c.status === 'Pending').length;
  const scheduledToday = consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length;
  const completedToday = consultations.filter((c) => c.status === 'Completed' && isToday(c.updated_at)).length;
  return (
    <>
      <SEO title="Dashboard" description="Doctor overview and consultation queue" />
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={`Good day, Dr. ${user?.name?.split(' ')[0]}!`} description="Here's your consultation overview." iconClassName="bg-emerald-50 text-emerald-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Pending Requests" value={pending} icon={Clock} color="text-amber-500" bg="bg-amber-100" />
        <StatCard label="Scheduled Today" value={scheduledToday} icon={Calendar} color="text-sky-500" bg="bg-sky-100" />
        <StatCard label="Completed Today" value={completedToday} icon={CheckCircle} color="text-emerald-500" bg="bg-emerald-100" />
        <StatCard label="Prescriptions Issued" value={prescriptions.length} icon={FileText} color="text-indigo-500" bg="bg-indigo-100" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ConsultationQueue consultations={consultations} />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickLink to="/consultations" icon={Video} label="Start Teleconsultation" color="text-indigo-700" bg="bg-indigo-50" />
            <QuickLink to="/prescriptions" icon={FileText} label="Create E-Prescription" color="text-emerald-700" bg="bg-emerald-50" />
            <QuickLink to="/medicines" icon={Pill} label="Browse Medicines" color="text-sky-700" bg="bg-sky-50" />
            <QuickLink to="/patient-records" icon={ClipboardList} label="Patient Records" color="text-amber-700" bg="bg-amber-50" />
          </div>
        </div>
      </div>
    </>
  );
}

function PatientOverview({ user, consultations, prescriptions }) {
  const upcoming = consultations.find((c) => c.status === 'Scheduled');
  const vitalEntries = consultations.filter((c) => c.vital_signs || c.vitalSigns).length;
  return (
    <>
      <SEO title="Dashboard" description="Patient health dashboard" />
      <header className="mb-8">
        <PageTitle icon={HeartPulse} title={`Hello, ${user?.name?.split(' ')[0]}!`} description="Here's your health summary and upcoming activities." iconClassName="bg-rose-50 text-rose-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Consultations" value={consultations.length} icon={Stethoscope} color="text-sky-500" bg="bg-sky-100" />
        <StatCard label="Prescriptions" value={prescriptions.length} icon={FileText} color="text-emerald-500" bg="bg-emerald-100" />
        <StatCard label="Vital Sign Entries" value={vitalEntries} icon={HeartPulse} color="text-rose-500" bg="bg-rose-100" />
        <StatCard label="Upcoming Visit" value={upcoming?.scheduled_at ? new Date(upcoming.scheduled_at).toLocaleDateString() : 'None'} icon={Calendar} color="text-indigo-500" bg="bg-indigo-100" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ConsultationQueue consultations={consultations} />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickLink to="/consultations" icon={Video} label="Request Teleconsult" color="text-sky-700" bg="bg-sky-50" />
            <QuickLink to="/vitals" icon={HeartPulse} label="Record Vital Signs" color="text-rose-700" bg="bg-rose-50" />
            <QuickLink to="/medical-images" icon={ImagePlus} label="Upload Medical Image" color="text-amber-700" bg="bg-amber-50" />
            <QuickLink to="/prescriptions" icon={FileText} label="View Prescriptions" color="text-emerald-700" bg="bg-emerald-50" />
          </div>
        </div>
      </div>
      {vitalEntries === 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-800">Vital Signs Reminder</p>
            <p className="text-sm text-rose-600 mt-0.5">No vital signs have been recorded yet.</p>
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
  const lowStock = medicines.filter((m) => m.status && Number(m.stock_quantity) <= 100).length;
  return (
    <>
      <SEO title="Dashboard" description="Staff dashboard overview" />
      <header className="mb-8">
        <PageTitle icon={Users} title="Staff Dashboard" description={`Welcome, ${user?.name}. Here's the current workload.`} iconClassName="bg-amber-50 text-amber-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Pending Approvals" value={pending} icon={Clock} color="text-amber-500" bg="bg-amber-100" />
        <StatCard label="Active Patients" value={formatNumber(stats.summary?.registered_patients)} icon={Users} color="text-sky-500" bg="bg-sky-100" />
        <StatCard label="Medicine Stock Alerts" value={lowStock} icon={AlertCircle} color="text-rose-500" bg="bg-rose-100" />
        <StatCard label="Scheduled Today" value={consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length} icon={Calendar} color="text-emerald-500" bg="bg-emerald-100" />
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
    api.get('/consultations').then((res) => setConsultations(res.data || [])).catch(() => setConsultations([]));
    api.get('/prescriptions').then((res) => setPrescriptions(res.data || [])).catch(() => setPrescriptions([]));
    api.get('/medicines').then((res) => setMedicines(res.data || [])).catch(() => setMedicines([]));
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      api.get('/analytics/stats').then((res) => setStats({ ...EMPTY_STATS, ...res.data })).catch(() => setStats(EMPTY_STATS));
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
