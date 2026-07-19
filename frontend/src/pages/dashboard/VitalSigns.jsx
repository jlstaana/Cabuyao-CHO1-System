import { useEffect, useState, useMemo } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { HeartPulse, Thermometer, Wind, Activity, Plus, Clock, TrendingUp, AlertCircle, Search, User, Filter } from 'lucide-react';
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
  sky:     { bg: 'bg-primary-bg',     icon: 'text-sky-500',     border: 'border-sky-200',     badge: 'bg-primary-hover text-primary-text' },
  rose:    { bg: 'bg-danger-bg',    icon: 'text-rose-500',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  amber:   { bg: 'bg-warning-bg',   icon: 'text-amber-500',   border: 'border-amber-200',   badge: 'bg-amber-100 text-warning-text' },
  emerald: { bg: 'bg-success-bg', icon: 'text-emerald-500', border: 'border-emerald-200', badge: 'bg-emerald-100 text-success-text' },
  indigo:  { bg: 'bg-brand-bg',  icon: 'text-indigo-500',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-brand-text' },
  purple:  { bg: 'bg-purple-50',  icon: 'text-purple-500',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700' },
};

function mapVitalHistory(vitals) {
  return vitals.map((v) => ({
    id: v.id,
    patientId: v.patient_id,
    patientName: v.patient?.user?.name || 'Patient',
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
  const isPatient = user?.role === 'Patient';

  const [form, setForm] = useState({ blood_pressure: '', heart_rate: '', temperature: '', respiratory: '', oxygen: '', weight: '' });
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [history, setHistory] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Fetch data on load
  useEffect(() => {
    let isActive = true;
    setLoading(true);

    if (isPatient) {
      api.get('/vitals')
        .then((res) => {
          if (isActive) {
            setHistory(mapVitalHistory(res.data || []));
          }
        })
        .catch(() => { if (isActive) setHistory([]); })
        .finally(() => { if (isActive) setLoading(false); });
    } else {
      // Doctor / Admin / Staff: fetch all vitals and build patient list from consultations / vitals
      Promise.all([
        api.get('/vitals'),
        api.get('/consultations').catch(() => ({ data: [] })),
      ]).then(([vitalsRes, consultsRes]) => {
        if (!isActive) return;

        const vitalsList = vitalsRes.data || [];
        const mapped = mapVitalHistory(vitalsList);
        setHistory(mapped);

        // Build list of unique patients
        const patientMap = new Map();

        vitalsList.forEach(v => {
          if (v.patient_id && v.patient?.user?.name) {
            patientMap.set(v.patient_id, { id: v.patient_id, name: v.patient.user.name });
          }
        });

        (consultsRes.data || []).forEach(c => {
          if (c.patient_id && c.patient?.user?.name) {
            patientMap.set(c.patient_id, { id: c.patient_id, name: c.patient.user.name });
          }
        });

        const pts = Array.from(patientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        setPatientOptions(pts);
        if (pts.length > 0 && !selectedPatientId) {
          setSelectedPatientId(pts[0].id);
        }
      }).catch(() => {
        if (isActive) setHistory([]);
      }).finally(() => {
        if (isActive) setLoading(false);
      });
    }

    return () => { isActive = false; };
  }, [user, isPatient]);

  // Filtered patient list for doctor dropdown search
  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patientOptions;
    return patientOptions.filter(p => p.name.toLowerCase().includes(q));
  }, [patientOptions, patientSearch]);

  // Filtered history based on selected patient or search
  const displayHistory = useMemo(() => {
    if (isPatient) return history;
    if (!selectedPatientId || selectedPatientId === 'ALL') return history;
    return history.filter(h => String(h.patientId) === String(selectedPatientId));
  }, [history, selectedPatientId, isPatient]);

  const latest = displayHistory[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(form).some((v) => String(v).trim() !== '')) {
      toast.error('Please enter at least one vital sign value.');
      return;
    }

    if (!isPatient && (!selectedPatientId || selectedPatientId === 'ALL')) {
      toast.error('Please select a specific patient to record vital signs.');
      return;
    }

    setSaving(true);
    try {
      const payload = isPatient ? form : { ...form, patient_id: selectedPatientId };
      const response = await api.post('/vitals', payload);
      const newVital = response.data.data;
      const now = new Date(newVital.created_at || Date.now()).toLocaleString();
      const patientName = newVital.patient?.user?.name || patientOptions.find(p => String(p.id) === String(selectedPatientId))?.name || 'Patient';

      setHistory((prev) => [{
        id: newVital.id,
        patientId: newVital.patient_id,
        patientName,
        date: now,
        ...form,
      }, ...prev]);

      toast.success(`Vital signs recorded for ${patientName}!`);
      setForm({ blood_pressure: '', heart_rate: '', temperature: '', respiratory: '', oxygen: '', weight: '' });
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vital signs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle
          icon={HeartPulse}
          title={isPatient ? "My Vital Signs" : "Patient Vital Signs Records"}
          description={isPatient
            ? "Record and track your daily health measurements."
            : "View and record vital signs measurements for patients across the health office."}
          iconClassName="bg-danger-bg text-danger-text"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl hover:bg-rose-600 transition-all shadow-md shadow-rose-200 font-medium active:scale-95 shrink-0"
        >
          <Plus size={18} /> {showForm ? 'Cancel' : 'Record Vital Signs'}
        </button>
      </div>

      {/* Patient Selector Bar for Doctors/Staff/Admin */}
      {!isPatient && (
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-text">
              <User size={16} className="text-rose-500" />
              <span>Select Patient:</span>
            </div>

            <div className="flex flex-1 sm:flex-initial gap-2 items-center flex-wrap sm:flex-nowrap">
              <select
                id="vital-patient-select"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 min-w-[200px]"
              >
                <option value="ALL">All Patients ({history.length} records)</option>
                {patientOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Filter patient list..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick-entry form */}
      {showForm && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text flex items-center gap-2">
              <HeartPulse size={18} className="text-rose-500" />
              {isPatient
                ? "Enter Today's Readings"
                : `Record Vital Signs for ${patientOptions.find(p => String(p.id) === String(selectedPatientId))?.name || 'Selected Patient'}`}
            </h2>
          </div>

          {!isPatient && (!selectedPatientId || selectedPatientId === 'ALL') && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} /> Please select a specific patient in the dropdown above before saving.
            </div>
          )}

          <form data-tour="page-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {VITAL_FIELDS.map((field) => {
                const Icon = field.icon;
                const c = COLOR_MAP[field.color];
                return (
                  <div key={field.key} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                    <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${c.icon}`}>
                      <Icon size={15} /> {field.label}
                      <span className="ml-auto text-xs font-normal text-text-light">{field.unit}</span>
                    </label>
                    <input
                      type="text"
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-surface px-3 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                    />
                    <p className="text-[11px] text-text-light mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> Normal: {field.normal}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:bg-surface-hover">Cancel</button>
              <button
                type="submit"
                disabled={saving || (!isPatient && (!selectedPatientId || selectedPatientId === 'ALL'))}
                className="flex items-center gap-2 bg-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-md shadow-rose-200 disabled:opacity-50"
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
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Latest Reading {!isPatient && `(${latest.patientName})`} — {latest.date}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VITAL_FIELDS.map((field) => {
              const Icon = field.icon;
              const c = COLOR_MAP[field.color];
              const value = latest[field.key];
              return (
                <div key={field.key} className={`bg-surface rounded-2xl border ${c.border} p-4 flex flex-col items-center text-center shadow-sm`}>
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                    <Icon size={20} className={c.icon} />
                  </div>
                  <p className={`text-lg font-black ${c.icon}`}>{value || '—'}</p>
                  <p className="text-[11px] text-text-light mt-0.5">{field.unit}</p>
                  <p className="text-xs text-text-muted font-medium mt-1 leading-tight">{field.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Vital Signs History
          </h2>
          <span className="text-xs font-semibold text-text-muted">
            {displayHistory.length} {displayHistory.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table data-tour="page-list" className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-background text-text-muted text-xs border-b border-border">
                {!isPatient && <th className="px-5 py-3 font-semibold">Patient Name</th>}
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
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-text-muted">Loading vital signs data...</td></tr>
              ) : displayHistory.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-text-light">No vital signs recorded for this selection. Tap "Record Vital Signs" to add readings.</td></tr>
              ) : displayHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-background/60 transition-colors">
                  {!isPatient && <td className="px-5 py-3 font-semibold text-text">{entry.patientName}</td>}
                  <td className="px-5 py-3 text-text-muted font-medium">{entry.date}</td>
                  <td className="px-5 py-3"><span className="font-semibold text-primary-text">{entry.blood_pressure || '—'}</span> mmHg</td>
                  <td className="px-5 py-3"><span className="font-semibold text-danger-text">{entry.heart_rate || '—'}</span> bpm</td>
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
