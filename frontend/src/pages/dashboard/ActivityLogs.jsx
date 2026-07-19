import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import PageTitle from '../../components/PageTitle';
import { ShieldCheck, Search, X, Filter, Monitor, AlertTriangle, CheckCircle, LogIn, LogOut, RefreshCw, ChevronLeft, ChevronRight, HeartPulse } from 'lucide-react';

const ACTION_ICONS = {
  'login':       { icon: LogIn,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'logout':      { icon: LogOut,       color: 'text-slate-500',   bg: 'bg-slate-100'  },
  'failed':      { icon: AlertTriangle,color: 'text-rose-600',    bg: 'bg-rose-50'    },
  'unauthorized':{ icon: AlertTriangle,color: 'text-rose-600',    bg: 'bg-rose-50'    },
  'security':    { icon: AlertTriangle,color: 'text-amber-600',   bg: 'bg-amber-50'   },
  'system':      { icon: Monitor,      color: 'text-sky-600',     bg: 'bg-sky-50'     },
  'backup':      { icon: Monitor,      color: 'text-sky-600',     bg: 'bg-sky-50'     },
  'health':      { icon: Monitor,      color: 'text-sky-600',     bg: 'bg-sky-50'     },
  'vitals':      { icon: HeartPulse,   color: 'text-rose-600',    bg: 'bg-rose-50'    },
  'default':     { icon: CheckCircle,  color: 'text-violet-600',  bg: 'bg-violet-50'  },
};

function getActionMeta(action = '') {
  const key = action.toLowerCase();
  if (key.includes('vital'))    return ACTION_ICONS.vitals;
  if (key.includes('login') && !key.includes('failed'))    return ACTION_ICONS.login;
  if (key.includes('logout'))   return ACTION_ICONS.logout;
  if (key.includes('failed') || key.includes('unauthorized')) return ACTION_ICONS.failed;
  if (key.includes('system') || key.includes('startup') || key.includes('database') || key.includes('cache')) return ACTION_ICONS.system;
  if (key.includes('backup') || key.includes('health'))    return ACTION_ICONS.backup;
  return ACTION_ICONS.default;
}

const ROLE_BADGE = {
  Admin:   'bg-violet-100 text-violet-700',
  Doctor:  'bg-sky-100 text-sky-700',
  Staff:   'bg-amber-100 text-amber-700',
  Patient: 'bg-emerald-100 text-emerald-700',
  System:  'bg-slate-100 text-slate-600',
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function ActivityLogs() {
  const { user } = useAuthStore();
  const isAdminOrStaff = ['Admin', 'Staff'].includes(user?.role);
  const [logs, setLogs]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);

  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/activity-logs', {
        params: { page: params.page ?? page, search, role, date_from: dateFrom, date_to: dateTo },
      });
      setLogs(res.data.data);
      setMeta(res.data);
    } catch {
      toast.error('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const applyFilters = () => { setPage(1); fetchLogs({ page: 1 }); };
  const clearFilters = () => { setSearch(''); setRole(''); setDateFrom(''); setDateTo(''); setPage(1); };
  const hasActive = search || role || dateFrom || dateTo;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <PageTitle
          icon={ShieldCheck}
          title="Activity Logs"
          description={isAdminOrStaff
            ? 'Track and audit all staff, doctor, patient, and system actions for compliance and transparency.'
            : 'A record of your own access and activity within the Cabuyao CHO-I Telehealth System.'}
          iconClassName="bg-violet-100 text-violet-600"
        />
        <button
          id="activity-logs-refresh"
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-muted hover:bg-surface-hover transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              id="activity-log-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Search action, user, description, or IP..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Role filter — Admin/Staff only */}
          {isAdminOrStaff && (
            <select
              id="activity-log-role-filter"
              value={role}
              onChange={e => { setRole(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Staff">Staff</option>
              <option value="Patient">Patient</option>
            </select>
          )}

          <button
            id="activity-log-filter-toggle"
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
              showFilters || dateFrom || dateTo
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-surface border-border text-text-muted hover:bg-surface-hover'
            }`}
          >
            <Filter size={14} /> Date
            {(dateFrom || dateTo) && <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />}
          </button>

          <button
            id="activity-log-apply"
            onClick={applyFilters}
            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all"
          >
            Search
          </button>

          {hasActive && (
            <button
              id="activity-log-clear"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-sm font-medium hover:bg-rose-100 transition-all"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-surface animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Date From</label>
              <input id="activity-log-date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Date To</label>
              <input id="activity-log-date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
        )}

        {meta && !loading && (
          <p className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text">{meta.from ?? 0}–{meta.to ?? 0}</span> of <span className="font-semibold text-text">{meta.total}</span> log entries
          </p>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-36 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-64" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    {hasActive ? 'No log entries match your search.' : 'No activity logs found.'}
                  </td>
                </tr>
              ) : logs.map((log, idx) => {
                const meta2 = getActionMeta(log.action);
                const Icon = meta2.icon;
                const roleBadge = ROLE_BADGE[log.role] ?? ROLE_BADGE.System;
                return (
                  <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 text-text-muted text-xs">{(page - 1) * 25 + idx + 1}</td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta2.bg} ${meta2.color}`}>
                        <Icon size={11} />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-text text-xs">{log.user ?? 'System'}</span>
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge}`}>
                          {log.role ?? 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted max-w-sm">
                      <div>{log.description ?? '—'}</div>
                      {/* Formatted Vital Signs Pills */}
                      {log.action === 'Vital Signs Recorded' && log.description && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {log.description.includes('BP:') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              🩸 {log.description.match(/BP:\s*([^\s,]+(?:\s*mmHg)?)/i)?.[0] || 'BP'}
                            </span>
                          )}
                          {log.description.includes('HR:') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              ❤️ {log.description.match(/HR:\s*([^\s,]+(?:\s*bpm)?)/i)?.[0] || 'HR'}
                            </span>
                          )}
                          {log.description.includes('Temp:') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              🌡️ {log.description.match(/Temp:\s*([^\s,]+(?:\s*°C)?)/i)?.[0] || 'Temp'}
                            </span>
                          )}
                          {(log.description.includes('SpO2:') || log.description.includes('Oxygen:')) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🫁 {log.description.match(/(?:SpO2|Oxygen):\s*([^\s,]+(?:\s*%)?)/i)?.[0] || 'SpO2'}
                            </span>
                          )}
                          {log.description.includes('Weight:') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              ⚖️ {log.description.match(/Weight:\s*([^\s,]+(?:\s*kg)?)/i)?.[0] || 'Weight'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-muted">{log.ip_address ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted">Page {meta.current_page} of {meta.last_page}</p>
            <div className="flex gap-2">
              <button
                id="activity-log-prev"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                id="activity-log-next"
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page === meta.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
