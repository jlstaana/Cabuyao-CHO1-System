import { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import { BarChart2, Activity, Download, List, TrendingUp, FileText, Users, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';

const REPORT_TABS = [
  { key: 'consultations', label: 'Consultation Statistics', icon: Activity },
  { key: 'prescriptions', label: 'E-Prescription Trends', icon: FileText },
  { key: 'utilization', label: 'Service Utilization', icon: TrendingUp },
  { key: 'logs', label: 'Activity Logs', icon: List },
];

const EMPTY_STATS = {
  summary: {},
  time_based_volume: [],
  consultations_by_status: [],
  consultations_by_doctor: [],
  top_diseases: [],
  low_stock_medicines: [],
  recent_logs: [],
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const getStatusTotal = (stats, status) => (
  stats.consultations_by_status.find((item) => item.status === status)?.total || 0
);

const maxTotal = (items) => Math.max(...items.map((item) => Number(item.total || item.count || 0)), 1);

function StatCard({ label, value, sub, color = 'sky' }) {
  const colors = {
    sky: 'bg-primary-bg text-primary-text border-sky-100',
    emerald: 'bg-success-bg text-emerald-600 border-success-border',
    indigo: 'bg-brand-bg text-indigo-600 border-brand-border',
    rose: 'bg-danger-bg text-danger-text border-danger-border',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-sky-500' }) {
  const width = max ? Math.max((Number(value || 0) / max) * 100, value ? 6 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-36 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-surface-hover/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-10 text-right">{formatNumber(value)}</span>
    </div>
  );
}

function EmptyBlock({ label }) {
  return (
    <div className="h-44 bg-background rounded-xl border border-dashed border-border flex items-center justify-center text-text-light text-sm">
      {label}
    </div>
  );
}

function tableRows(rows, columns) {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length}" class="empty">No records available</td></tr>`;
  }
  return rows.map((row) => (
    `<tr>${columns.map((column) => `<td>${row[column] ?? ''}</td>`).join('')}</tr>`
  )).join('');
}

function buildReportHtml(stats, generatedAt, generatedBy) {
  const summary = stats.summary || {};
  const statusRows = stats.consultations_by_status.map((row) => ({ Status: row.status, Total: row.total }));
  const doctorRows = stats.consultations_by_doctor.map((row) => ({ Doctor: row.name, Consultations: row.total }));
  const diseaseRows = (stats.top_diseases || []).map((row) => ({ Disease: row.diagnosis, Cases: row.total }));
  const lowStockRows = (stats.low_stock_medicines || []).map((row) => ({ Medicine: row.name, Stock: row.stock }));
  const volumeRows = stats.time_based_volume.map((row) => ({ Date: row.date, Consultations: row.count }));
  const logRows = stats.recent_logs.map((row) => ({
    Date: formatDateTime(row.created_at),
    User: row.user || 'System',
    Role: row.role || 'N/A',
    Action: row.action,
    IP: row.ip_address || 'N/A',
  }));

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cabuyao CHO Full Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 24px; }
    .meta { color: #475569; font-size: 12px; margin-top: 6px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 24px; }
    .card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 12px; }
    .card .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
    .card .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
    h2 { font-size: 16px; margin: 24px 0 8px; color: #075985; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #e0f2fe; color: #0c4a6e; text-align: left; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
    .empty { text-align: center; color: #64748b; font-style: italic; }
    .footer { margin-top: 28px; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cabuyao CHO Full Analytics Report</h1>
    <div class="meta">Generated: ${generatedAt.toLocaleString()} | Prepared by: ${generatedBy || 'System Administrator'}</div>
  </div>

  <div class="summary">
    <div class="card"><div class="label">Total Consultations</div><div class="value">${formatNumber(summary.total_consultations)}</div></div>
    <div class="card"><div class="label">Completed</div><div class="value">${formatNumber(summary.completed_consultations)}</div></div>
    <div class="card"><div class="label">Completion Rate</div><div class="value">${summary.completion_rate || 0}%</div></div>
    <div class="card"><div class="label">Prescriptions Issued</div><div class="value">${formatNumber(summary.prescriptions_issued)}</div></div>
  </div>

  <h2>Consultation Volume</h2>
  <table><thead><tr><th>Date</th><th>Consultations</th></tr></thead><tbody>${tableRows(volumeRows, ['Date', 'Consultations'])}</tbody></table>

  <h2>Consultations by Status</h2>
  <table><thead><tr><th>Status</th><th>Total</th></tr></thead><tbody>${tableRows(statusRows, ['Status', 'Total'])}</tbody></table>

  <h2>Consultations by Doctor</h2>
  <table><thead><tr><th>Doctor</th><th>Consultations</th></tr></thead><tbody>${tableRows(doctorRows, ['Doctor', 'Consultations'])}</tbody></table>

  <h2>Top Diagnosed Diseases</h2>
  <table><thead><tr><th>Disease / Diagnosis</th><th>Total Cases</th></tr></thead><tbody>${tableRows(diseaseRows, ['Disease', 'Cases'])}</tbody></table>

  <h2>Low Stock Medicines</h2>
  <table><thead><tr><th>Medicine</th><th>Current Stock</th></tr></thead><tbody>${tableRows(lowStockRows, ['Medicine', 'Stock'])}</tbody></table>

  <h2>Recent System Activity</h2>
  <table><thead><tr><th>Date</th><th>User</th><th>Role</th><th>Action</th><th>IP</th></tr></thead><tbody>${tableRows(logRows, ['Date', 'User', 'Role', 'Action', 'IP'])}</tbody></table>

  <div class="footer">This report is generated from live Cabuyao CHO system records.</div>
</body>
</html>`;
}

export default function Analytics() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('consultations');
  const [logFilter, setLogFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(EMPTY_STATS);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      return;
    }
    let isActive = true;
    api.get('/analytics/stats')
      .then((res) => {
        if (isActive) setStats({ ...EMPTY_STATS, ...res.data });
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, [user]);

  if (user?.role !== 'Admin') {
    return <div className="p-8 text-center text-text-muted bg-surface rounded-2xl shadow-sm border border-border">Access Denied. Health Officers only.</div>;
  }

  const summary = stats.summary || {};
  const filteredLogs = logFilter === 'all'
    ? stats.recent_logs
    : stats.recent_logs.filter((log) => (log.role || 'system').toLowerCase() === logFilter);

  const handleExportFullReport = () => {
    setExporting(true);
    try {
      const generatedAt = new Date();
      const html = buildReportHtml(stats, generatedAt, user?.name);
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cabuyao-cho-full-analytics-report-${generatedAt.toISOString().slice(0, 10)}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Full report exported');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const doctorMax = maxTotal(stats.consultations_by_doctor);
  const diseaseMax = maxTotal(stats.top_diseases || []);
  const lowStockMax = maxTotal(stats.low_stock_medicines || [], 'stock');
  const serviceRows = [
    { name: 'Registered Patients', total: summary.registered_patients || 0 },
    { name: 'Active Doctors', total: summary.active_doctors || 0 },
    { name: 'Inactive Users', total: summary.inactive_users || 0 },
    { name: 'Total Consultations', total: summary.total_consultations || 0 },
    { name: 'Prescriptions Issued', total: summary.prescriptions_issued || 0 },
  ];
  const serviceMax = maxTotal(serviceRows);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={BarChart2} title="Analytics & Reports" description="Generate descriptive analytics reports and monitor system activity logs." iconClassName="bg-brand-bg text-indigo-600" />
        <button
          data-tour="page-primary-action"
          onClick={handleExportFullReport}
          disabled={exporting || loading}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm disabled:opacity-70"
        >
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export Full Report'}
        </button>
      </div>

      <div data-tour="page-filters" className="flex gap-2 overflow-x-auto pb-1">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                active
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-200'
                  : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'consultations' && (
        <div data-tour="page-stats" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Consultations" value={formatNumber(summary.total_consultations)} sub="All records" color="sky" />
            <StatCard label="Completed" value={formatNumber(getStatusTotal(stats, 'Completed'))} sub={`${summary.completion_rate || 0}% completion`} color="emerald" />
            <StatCard label="Scheduled" value={formatNumber(getStatusTotal(stats, 'Scheduled'))} sub="Upcoming sessions" color="indigo" />
            <StatCard label="Pending / In Review" value={formatNumber(summary.pending_consultations)} sub="Needs action" color="rose" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-4 flex items-center gap-2"><Activity size={16} className="text-sky-500" /> Daily Consultation Volume</h3>
              {stats.time_based_volume.length ? (
                <div className="space-y-3">
                  {stats.time_based_volume.map((row) => <BarRow key={row.date} label={row.date} value={row.count} max={maxTotal(stats.time_based_volume)} />)}
                </div>
              ) : <EmptyBlock label="No consultation volume yet" />}
            </div>
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-500" /> By Doctor</h3>
              {stats.consultations_by_doctor.length ? (
                <div className="space-y-3">
                  {stats.consultations_by_doctor.map((row) => <BarRow key={row.name} label={row.name} value={row.total} max={doctorMax} color="bg-indigo-400" />)}
                </div>
              ) : <EmptyBlock label="No doctor consultation data yet" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} sub="All time" color="emerald" />
            <StatCard label="Low Stock Alerts" value={formatNumber(summary.low_stock_count)} sub="Items needing restock" color="amber" />
            <StatCard label="Top Diseases" value={formatNumber((stats.top_diseases || []).length)} sub="Based on diagnoses" color="indigo" />
            <StatCard label="Completed Consults" value={formatNumber(summary.completed_consultations)} sub="Eligible for prescriptions" color="rose" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-5 flex items-center gap-2"><FileText size={16} className="text-emerald-500" /> Top Diagnosed Diseases</h3>
              {(stats.top_diseases || []).length ? (
                <div className="space-y-3">
                  {stats.top_diseases.map((row) => <BarRow key={row.diagnosis} label={row.diagnosis} value={row.total} max={diseaseMax} color="bg-emerald-400" />)}
                </div>
              ) : <EmptyBlock label="No disease diagnosis data yet" />}
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-5 flex items-center gap-2"><FileText size={16} className="text-amber-500" /> Critical / Low Stock Medicines</h3>
              {(stats.low_stock_medicines || []).length ? (
                <div className="space-y-3">
                  {stats.low_stock_medicines.map((row) => <BarRow key={row.name} label={row.name} value={row.stock} max={Math.max(lowStockMax, 50)} color={row.stock === 0 ? "bg-rose-500" : "bg-amber-400"} />)}
                </div>
              ) : <EmptyBlock label="No low stock medicines" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'utilization' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Registered Patients" value={formatNumber(summary.registered_patients)} sub="Active patient records" color="indigo" />
            <StatCard label="Active Doctors" value={formatNumber(summary.active_doctors)} sub="Doctor accounts" color="sky" />
            <StatCard label="Inactive Users" value={formatNumber(summary.inactive_users)} sub="Archived accounts" color="slate" />
            <StatCard label="Total Consults" value={formatNumber(summary.total_consultations)} sub="All-time consultations" color="emerald" />
            <StatCard label="Pending Work" value={formatNumber(summary.pending_consultations)} sub="Open consultations" color="rose" />
          </div>
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-sky-500" /> System Utilization</h3>
            <div className="space-y-3">
              {serviceRows.map((row) => <BarRow key={row.name} label={row.name} value={row.total} max={serviceMax} color="bg-sky-400" />)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h3 className="font-semibold text-text flex items-center gap-2"><List size={16} className="text-rose-500" /> System Activity Logs</h3>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-text-light" />
              {['all','admin','doctor','staff','patient','system'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${logFilter === f ? 'bg-slate-900 text-white' : 'bg-surface-hover/50 text-text-muted hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredLogs.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-text-light">No activity logs found.</div>
            ) : filteredLogs.map((log, i) => (
              <div key={`${log.created_at}-${i}`} className="flex justify-between items-center px-6 py-4 hover:bg-background/60 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{log.action}</p>
                  <p className="text-xs text-text-light mt-0.5">{log.user || 'System'}{log.role ? ` · ${log.role}` : ''}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs font-semibold text-text-light">{formatDateTime(log.created_at)}</p>
                  <p className="text-[11px] text-text-light opacity-60 mt-0.5">IP: {log.ip_address || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
