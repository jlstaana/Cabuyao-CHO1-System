import { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { HeartPulse, Thermometer, Wind, Activity, Plus, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const VITAL_FIELDS = [
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: Activity,     placeholder: 'e.g. 120/80',   color: 'sky',     normal: '90/60 – 120/80' },
  { key: 'heart_rate',     label: 'Heart Rate',     unit: 'bpm',  icon: HeartPulse,   placeholder: 'e.g. 72',       color: 'rose',    normal: '60 – 100 bpm' },
  { key: 'temperature',   label: 'Temperature',    unit: '°C',   icon: Thermometer,  placeholder: 'e.g. 36.6',    color: 'amber',   normal: '36.1 – 37.2°C' },
  { key: 'respiratory',   label: 'Respiratory Rate', unit: '/min', icon: Wind,       placeholder: 'e.g. 16',       color: 'emerald', normal: '12 – 20 /min' },
  { key: 'oxygen',        label: 'Oxygen Saturation', unit: '%',  icon: TrendingUp,  placeholder: 'e.g. 98',       color: 'indigo',  normal: '95 – 100%' },
  { key: 'weight',        label: 'Weight',          unit: 'kg',   icon: Activity,     placeholder: 'e.g. 65',       color: 'purple',  normal: 'BMI < 25 ideal' },
];

const COLOR_MAP = {
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/30',     icon: 'text-sky-500',     border: 'border-sky-200',     badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/30',    icon: 'text-rose-500 dark:text-rose-400',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   icon: 'text-amber-500',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-500', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 dark:text-emerald-400' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30',  icon: 'text-indigo-500',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700 dark:text-indigo-400' },
  purple:  { bg: 'bg-purple-50',  icon: 'text-purple-500',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700' },
};

function mapVitalHistory(vitals) {
  return vitals.map((v) => ({
    id: v.id,
    date: new Date(v.created_at).toLocaleString(),
    blood_pressure: v.blood_pressure || '',
    heart_rate: v.heart_rate || '',
    temperature: v.temperature || '',
    respiratory: v.respiratory || '',
    oxygen: v.oxygen || '',
    weight: v.weight || '',
  }));
}

export default function VitalSigns() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ blood_pressure: '', heart_rate: '', temperature: '', respiratory: '', oxygen: '', weight: '' });
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Patient') return;
    let isActive = true;
    api.get('/vitals')
      .then((res) => {
        if (isActive) {
          setHistory(mapVitalHistory(res.data || []));
        }
      })
      .catch(() => {
        if (isActive) setHistory([]);
      });
    return () => { isActive = false; };
  }, [user]);

  // Guard: Patients only
  if (user?.role !== 'Patient') {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-zinc-500 bg-surface rounded-2xl shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
        This page is only accessible to patients.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check at least one field filled
    if (!Object.values(form).some((v) => v.trim() !== '')) {
      toast.error('Please enter at least one vital sign value.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/vitals', form);
      const newVital = response.data.data;
      const now = new Date(newVital.created_at || Date.now()).toLocaleString();
      setHistory((prev) => [{ id: newVital.id, date: now, ...form }, ...prev]);
      toast.success('Vital signs recorded successfully!');
      setForm({ blood_pressure: '', heart_rate: '', temperature: '', respiratory: '', oxygen: '', weight: '' });
      setShowForm(false);
    } catch {
      toast.error('Failed to save vital signs. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Latest reading
  const latest = history[0];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <SEO title="Vital Signs" description="Record and track your daily vital signs" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={HeartPulse} title="Vital Signs" description="Record and track your daily health measurements." iconClassName="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl hover:bg-rose-600 transition-all shadow-md dark:shadow-none shadow-rose-200 font-medium active:scale-95"
        >
          <Plus size={18} /> {showForm ? 'Cancel' : 'Record Now'}
        </button>
      </div>

      {/* Quick-entry form */}
      {showForm && (
        <div className="bg-surface rounded-2xl border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 shadow-sm dark:shadow-none p-6">
          <h2 className="font-semibold text-text mb-5 flex items-center gap-2">
            <HeartPulse size={18} className="text-rose-500 dark:text-rose-400" /> Enter Today's Readings
          </h2>
          <form data-tour="page-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {VITAL_FIELDS.map((field) => {
                const Icon = field.icon;
                const c = COLOR_MAP[field.color];
                return (
                  <div key={field.key} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                    <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${c.icon}`}>
                      <Icon size={15} /> {field.label}
                      <span className="ml-auto text-xs font-normal text-slate-400 dark:text-zinc-500">{field.unit}</span>
                    </label>
                    <input
                      type="text"
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-surface px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> Normal: {field.normal}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-rose-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-md dark:shadow-none shadow-rose-200 disabled:opacity-70"
              >
                <HeartPulse size={16} /> {saving ? 'Saving...' : 'Save Readings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Latest readings summary */}
      {latest && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Latest Reading — {latest.date}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VITAL_FIELDS.map((field) => {
              const Icon = field.icon;
              const c = COLOR_MAP[field.color];
              const value = latest[field.key];
              return (
                <div key={field.key} className={`bg-surface rounded-2xl border ${c.border} p-4 flex flex-col items-center text-center shadow-sm dark:shadow-none`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                    <Icon size={20} className={c.icon} />
                  </div>
                  <p className={`text-lg font-black ${c.icon}`}>{value || '—'}</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{field.unit}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium mt-1 leading-tight">{field.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-surface rounded-2xl border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="p-5 border-b border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Vital Signs History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table data-tour="page-list" className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-background text-slate-500 dark:text-zinc-500 text-xs border-b border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
                <th className="px-5 py-3 font-semibold">Date &amp; Time</th>
                <th className="px-5 py-3 font-semibold">Blood Pressure</th>
                <th className="px-5 py-3 font-semibold">Heart Rate</th>
                <th className="px-5 py-3 font-semibold">Temp (°C)</th>
                <th className="px-5 py-3 font-semibold">Respiratory</th>
                <th className="px-5 py-3 font-semibold">SpO₂ (%)</th>
                <th className="px-5 py-3 font-semibold">Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500">No vital signs recorded yet. Tap "Record Now" to start.</td></tr>
              ) : history.map((entry) => (
                <tr key={entry.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-5 py-3 text-slate-600 dark:text-zinc-400 font-medium">{entry.date}</td>
                  <td className="px-5 py-3"><span className="font-semibold text-sky-700 dark:text-sky-400">{entry.blood_pressure || '—'}</span> mmHg</td>
                  <td className="px-5 py-3"><span className="font-semibold text-rose-600 dark:text-rose-400">{entry.heart_rate || '—'}</span> bpm</td>
                  <td className="px-5 py-3"><span className="font-semibold text-amber-600">{entry.temperature || '—'}</span></td>
                  <td className="px-5 py-3"><span className="font-semibold text-emerald-600">{entry.respiratory || '—'}</span>/min</td>
                  <td className="px-5 py-3"><span className="font-semibold text-indigo-600">{entry.oxygen || '—'}</span>%</td>
                  <td className="px-5 py-3"><span className="font-semibold text-purple-600">{entry.weight || '—'}</span> kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
