import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import {
  ClipboardList, Video, FileText, Search, Filter,
  Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageTitle from '../../components/PageTitle';

const STATUS_CONFIG = {
  Completed:  { color: 'bg-emerald-100 text-success-text', icon: CheckCircle },
  Scheduled:  { color: 'bg-primary-hover text-primary-text',         icon: Clock },
  Pending:    { color: 'bg-amber-100 text-warning-text',      icon: Loader2 },
  Cancelled:  { color: 'bg-surface-hover/50 text-text-muted',      icon: XCircle },
};

const FILTERS = ['All', 'Completed', 'Scheduled', 'Pending', 'Cancelled'];

function toHistoryItem(c) {
  const when = c.scheduled_at || c.created_at;
  return {
    id: c.id,
    doctor: c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\.\s*/i, '')}` : 'Doctor to be assigned',
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
      <div className="p-8 text-center text-text-muted bg-surface rounded-2xl shadow-sm border border-border">
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">      {/* Header */}
      <header>
        <PageTitle icon={ClipboardList} title="Consultation History" description="A complete record of all your past and upcoming consultations." iconClassName="bg-primary-bg text-primary-text" />
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',     value: total,     icon: ClipboardList, gradient: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-200', sub: 'All logged consultations' },
          { label: 'Completed',          value: completed, icon: CheckCircle,   gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200', sub: 'Successfully finished' },
          { label: 'Cancelled',          value: history.filter(c => c.status === 'Cancelled').length, icon: XCircle, gradient: 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-200', sub: 'Discontinued requests' },
          { label: 'Prescriptions',      value: history.filter(c => c.prescription_id).length, icon: FileText, gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200', sub: 'Received documents' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`p-5 rounded-2xl border shadow-md border-transparent ${s.gradient}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">{s.label}</span>
                <div className="p-2 rounded-xl bg-white/20 text-white">
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-black mt-1 text-white">{s.value}</p>
              <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div data-tour="page-search" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, diagnosis, or date..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-surface transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={16} className="text-text-light shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === f
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History list */}
      <div data-tour="page-list" className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-surface-hover rounded w-48 mb-3" />
              <div className="h-4 bg-surface-hover/50 rounded w-72" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-14 text-center">
            <ClipboardList size={36} className="mx-auto mb-3 text-text-light opacity-60" />
            <p className="font-semibold text-text-muted">No consultations found</p>
            <p className="text-sm text-text-light mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Pending;
            const StatusIcon = statusCfg.icon;
            const isOpen = expanded === c.id;

            return (
              <div key={c.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-none transition-shadow">
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  {/* Type icon */}
                  <div className="w-11 h-11 rounded-xl bg-primary-bg flex items-center justify-center flex-shrink-0">
                    <Video size={20} className="text-sky-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text">{c.doctor}</p>
                      <span className="text-xs text-text-light">·</span>
                      <p className="text-sm text-text-muted">{c.specialization}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-light">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {c.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {c.time}</span>
                      <span className="bg-surface-hover/50 text-text-muted px-2 py-0.5 rounded-full font-medium">{c.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {c.status}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                    {c.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-text-light uppercase tracking-wide mb-1">Diagnosis</p>
                        <p className="text-sm font-semibold text-text">{c.diagnosis}</p>
                      </div>
                    )}
                    {c.notes && (
                      <div>
                        <p className="text-xs font-semibold text-text-light uppercase tracking-wide mb-1">Doctor's Notes</p>
                        <p className="text-sm text-text-muted leading-relaxed">{c.notes}</p>
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
                          className="flex items-center gap-2 px-4 py-2 bg-success-bg text-success-text rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
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
