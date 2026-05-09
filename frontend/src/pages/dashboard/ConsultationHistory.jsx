import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import {
  ClipboardList, Video, FileText, Search, Filter,
  Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_CONFIG = {
  Completed:  { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  Scheduled:  { color: 'bg-sky-100 text-sky-700',         icon: Clock },
  Pending:    { color: 'bg-amber-100 text-amber-700',      icon: Loader2 },
  Cancelled:  { color: 'bg-slate-100 text-slate-500',      icon: XCircle },
};

const FILTERS = ['All', 'Completed', 'Scheduled', 'Pending', 'Cancelled'];

function toHistoryItem(c) {
  const when = c.scheduled_at || c.created_at;
  return {
    id: c.id,
    doctor: c.doctor?.user?.name ? `Dr. ${c.doctor.user.name}` : 'Doctor to be assigned',
    specialization: c.doctor?.specialization || 'General Practice',
    date: when ? new Date(when).toLocaleDateString() : 'N/A',
    time: when ? new Date(when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    type: 'Teleconsultation',
    status: c.status,
    diagnosis: c.form?.diagnosis,
    notes: c.form?.notes,
    prescription_id: c.prescription?.id,
  };
}

export default function ConsultationHistory() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let isActive = true;
    api.get('/patients/history')
      .then((res) => {
        if (isActive) setHistory((res.data || []).map(toHistoryItem));
      })
      .catch(() => {
        if (isActive) setHistory([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  // Guard: Patient only
  if (user?.role !== 'Patient') {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
        This page is only accessible to patients.
      </div>
    );
  }

  const filtered = history.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.doctor.toLowerCase().includes(q) ||
      (c.diagnosis || '').toLowerCase().includes(q) ||
      c.date.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const completed = history.filter((c) => c.status === 'Completed').length;
  const total = history.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <SEO title="Consultation History" description="View your complete consultation history" />

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Consultation History</h1>
        <p className="text-slate-500 mt-1">A complete record of all your past and upcoming consultations.</p>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',     value: total,     color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100' },
          { label: 'Completed',          value: completed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Cancelled',          value: history.filter(c => c.status === 'Cancelled').length, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
          { label: 'Prescriptions',      value: history.filter(c => c.prescription_id).length, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg} ${s.border}`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, diagnosis, or date..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === f
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-48 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-72" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center">
            <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No consultations found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Pending;
            const StatusIcon = statusCfg.icon;
            const isOpen = expanded === c.id;

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  {/* Type icon */}
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Video size={20} className="text-sky-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{c.doctor}</p>
                      <span className="text-xs text-slate-400">·</span>
                      <p className="text-sm text-slate-500">{c.specialization}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {c.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {c.time}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{c.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {c.status}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                    {c.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Diagnosis</p>
                        <p className="text-sm font-semibold text-slate-800">{c.diagnosis}</p>
                      </div>
                    )}
                    {c.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Doctor's Notes</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{c.notes}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {c.status === 'Scheduled' && (
                        <Link
                          to={`/room/${c.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                        >
                          <Video size={15} /> Join Teleconsultation
                        </Link>
                      )}
                      {c.prescription_id && (
                        <Link
                          to="/prescriptions"
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                        >
                          <FileText size={15} /> View Prescription
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
