import { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import { BarChart2, Activity, Download, TrendingUp, FileText, Users, Calendar, X, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';

import choLogo from '../../assets/CHO1-Logo.png';

const REPORT_TABS = [
  { key: 'consultations', label: 'Consultation Statistics', icon: Activity },
  { key: 'epidemiology', label: 'Population Health', icon: HeartPulse },
  { key: 'prescriptions', label: 'E-Prescription Trends', icon: FileText },
  { key: 'utilization', label: 'Service Utilization', icon: TrendingUp },
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
  const styles = {
    sky: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent',
    indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-transparent',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent',
  };
  
  const isText = typeof value === 'string' && isNaN(value.replace(/,/g, ''));
  const valueClass = isText ? 'text-xl font-bold truncate mt-2' : 'text-3xl font-black mt-1';
  
  return (
    <div className={`p-5 rounded-2xl border ${styles[color] || styles.sky}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</p>
      <p className={`${valueClass} text-white`} title={value}>{value}</p>
      {sub && <p className="text-[10px] mt-2 text-white/70 uppercase tracking-wide">{sub}</p>}
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
      <span className="text-xs font-semibold text-text-muted w-10 text-right">{formatNumber(value)}</span>
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
    return `<tr><td colspan="${columns.length}" style="text-align:center;color:#94a3b8;font-style:italic;padding:16px 12px;border:1px solid #e2e8f0;">No records available</td></tr>`;
  }
  return rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr>${columns.map((col) => `<td style="padding:9px 12px;border:1px solid #e2e8f0;font-size:12px;color:#334155;background:${bg};">${row[col] ?? ''}</td>`).join('')}</tr>`;
  }).join('');
}

function sectionHeader(title, dotColor) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr><td width="10" style="padding:0;vertical-align:top;padding-top:4px;"><div style="width:8px;height:8px;border-radius:50%;background:${dotColor};"></div></td><td style="padding:0 0 0 8px;font-size:13px;font-weight:700;color:#0f172a;">${title}</td></tr></table>`;
}

function dataTable(headers, bodyHtml) {
  const headCells = headers.map(([label, w]) =>
    `<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em;border:1px solid #bae6fd;background:#f0f9ff;${w ? 'width:' + w : ''}">${label}</th>`
  ).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:0;"><thead><tr>${headCells}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

// Returns an array of complete HTML strings — one per PDF page
function buildReportPages(stats, generatedAt, generatedBy, logoDataUrl, dateFrom, dateTo) {
  const summary = stats.summary || {};
  const statusRows  = stats.consultations_by_status.map((r) => ({ Status: r.status, Total: r.total }));
  const doctorRows  = stats.consultations_by_doctor.map((r) => ({ Doctor: r.name, Consultations: r.total }));
  const diseaseRows = (stats.top_diseases || []).map((r) => ({ Disease: r.diagnosis, Cases: r.total }));
  const lowStockRows = (stats.low_stock_medicines || []).map((r) => ({ Category: r.category, 'Low Stock Count': r.count }));
  
    const topDiagnosis = (reportStats.top_diseases && reportStats.top_diseases.length > 0) ? reportStats.top_diseases[0].diagnosis : 'N/A';
    const topBarangay = (reportStats.cases_by_barangay && reportStats.cases_by_barangay.length > 0) ? reportStats.cases_by_barangay[0].barangay : 'N/A';
    const topDemo = (reportStats.demographics_by_age && reportStats.demographics_by_age.length > 0) ? reportStats.demographics_by_age[0].category : 'N/A';
    const totalBarangays = (reportStats.cases_by_barangay || []).length;

    const epiKpiGrid = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;table-layout:fixed;">
        <tr>
          ${kpiCard('Top Diagnosis', topDiagnosis, '#f43f5e')}
          ${kpiCard('Most Affected Area', topBarangay, '#f59e0b')}
          ${kpiCard('Primary Demo', topDemo, '#0ea5e9')}
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-top:3px solid #10b981;background:#f8fafc;">
              <tr><td style="padding:12px 14px;">
                <div style="font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;">Barangays Covered</div>
                <div style="font-size:18px;font-weight:800;color:#10b981;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${totalBarangays}</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>`;

    const volumeRows  = stats.time_based_volume.map((r) => ({ Date: r.date, Consultations: r.count }));
  const ageRows = (stats.demographics_by_age || []).map((r) => ({ Category: r.category, Cases: r.total }));
  const barangayRows = (stats.cases_by_barangay || []).map((r) => ({ Barangay: r.barangay, Cases: r.total }));
  const logRows     = stats.recent_logs.map((r) => ({
    Date: formatDateTime(r.created_at), User: r.user || 'System',
    Role: r.role || 'N/A', Action: r.action, IP: r.ip_address || 'N/A',
  }));

  const dateStr = generatedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = generatedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const yr = generatedAt.getFullYear();
  const BODY = 'font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#0f172a;background:#fff;margin:0;padding:30px 36px;';

  const logo = (w, h) => logoDataUrl ? `<img src="${logoDataUrl}" width="${w}" height="${h}" style="display:block;" alt="CHO" />` : '';

  const dateRangeBadge = (dateFrom || dateTo)
    ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;color:#0369a1;font-size:8.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:99px;display:inline-block;margin-bottom:5px;">Period: ${dateFrom || 'Start'} &mdash; ${dateTo || 'Latest'}</div>`
    : '';

  const fullHeader = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:3px solid #0ea5e9;padding-bottom:14px;margin-bottom:20px;">
      <tr>
        <td width="68" style="vertical-align:middle;padding-right:12px;">${logo(58, 58)}</td>
        <td width="2" style="vertical-align:middle;"><div style="width:1px;height:50px;background:#cbd5e1;margin-right:14px;"></div></td>
        <td style="vertical-align:middle;padding-left:4px;">
          <div style="font-size:9.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Republic of the Philippines &middot; Cabuyao City</div>
          <div style="font-size:19px;font-weight:800;color:#0f172a;line-height:1.2;margin-top:2px;">City <span style="color:#0ea5e9;">Health</span> Office</div>
          <div style="font-size:10.5px;color:#64748b;margin-top:1px;">Telehealth &amp; E-Prescription Information System</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="background:#0ea5e9;color:#fff;font-size:8.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:99px;display:inline-block;margin-bottom:4px;">Official Report</div><br/>
          ${dateRangeBadge}
          <div style="font-size:10.5px;color:#64748b;line-height:1.75;">
            <b style="color:#0f172a;">Date:</b> ${dateStr}<br/>
            <b style="color:#0f172a;">Time:</b> ${timeStr}<br/>
            <b style="color:#0f172a;">Prepared by:</b> ${generatedBy || 'System Administrator'}
          </div>
        </td>
      </tr>
    </table>`;

  const miniHeader = (sub) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #0ea5e9;padding-bottom:9px;margin-bottom:16px;">
      <tr>
        <td width="38" style="vertical-align:middle;padding-right:9px;">${logo(30, 30)}</td>
        <td style="vertical-align:middle;">
          <div style="font-size:13.5px;font-weight:800;color:#0f172a;">Cabuyao City Health Office</div>
          <div style="font-size:9.5px;color:#64748b;">${sub}</div>
        </td>
        <td style="text-align:right;font-size:9.5px;color:#94a3b8;vertical-align:middle;">${dateStr} &mdash; ${timeStr}</td>
      </tr>
    </table>`;

  const pageFooter = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;padding-top:9px;margin-top:20px;">
      <tr>
        <td style="font-size:9px;color:#94a3b8;font-style:italic;">Cabuyao CHO Telehealth &amp; E-Prescription System &middot; ${yr}</td>
        <td style="text-align:right;font-size:9px;font-weight:700;color:#0ea5e9;">OFFICIAL DOCUMENT &mdash; FOR AUTHORIZED USE ONLY</td>
      </tr>
    </table>`;

  const wrap = (content) => `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head><body style="${BODY}">${content}${pageFooter}</body></html>`;

  const kpiCard = (label, value, color) => `
    <td style="padding:0 8px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-top:3px solid ${color};background:#f8fafc;">
        <tr><td style="padding:12px 14px;">
          <div style="font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;">${label}</div>
          <div style="font-size:22px;font-weight:800;color:${color};line-height:1;">${value}</div>
        </td></tr>
      </table>
    </td>`;

  const kpiGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;table-layout:fixed;">
      <tr>
        ${kpiCard('Registered Patients', formatNumber(summary.registered_patients), '#0ea5e9')}
        ${kpiCard('Completed', formatNumber(summary.completed_consultations), '#10b981')}
        ${kpiCard('Cancelled Consultations', formatNumber(summary.cancelled_consultations), '#f59e0b')}
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-top:3px solid #8b5cf6;background:#f8fafc;">
            <tr><td style="padding:12px 14px;">
              <div style="font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;">Prescriptions Issued</div>
              <div style="font-size:22px;font-weight:800;color:#8b5cf6;line-height:1;">${formatNumber(summary.prescriptions_issued)}</div>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>`;

  const twoCol = (leftContent, rightContent) => `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:49%;padding-right:14px;vertical-align:top;">${leftContent}</td>
        <td style="width:49%;vertical-align:top;">${rightContent}</td>
      </tr>
    </table>`;

  const signatures = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:18px;">
      <tr>
        <td style="width:33%;text-align:center;padding:0 10px;">
          <div style="border-bottom:1.5px solid #0f172a;height:46px;margin-bottom:7px;"></div>
          <div style="font-size:10.5px;font-weight:700;color:#0f172a;">Eduardo Gamnudoy Jr.</div>
          <div style="font-size:9.5px;color:#64748b;margin-top:3px;">System Admin</div>
          <div style="font-size:9.5px;color:#64748b;">CHO1</div>
        </td>
        <td style="width:33%;text-align:center;padding:0 10px;">
          <div style="border-bottom:1.5px solid #0f172a;height:46px;margin-bottom:7px;"></div>
          <div style="font-size:10.5px;font-weight:700;color:#0f172a;">Eduardo Gamnudoy Jr.</div>
          <div style="font-size:9.5px;color:#64748b;margin-top:2px;">Administrative Assistant-III</div>
          <div style="font-size:9.5px;color:#64748b;">CHO1</div>
        </td>
        <td style="width:33%;text-align:center;padding:0 10px;">
          <div style="border-bottom:1.5px solid #0f172a;height:46px;margin-bottom:7px;"></div>
          <div style="font-size:10.5px;font-weight:700;color:#0f172a;">Elena C. Diamante, MD, MPH</div>
          <div style="font-size:9.5px;color:#64748b;margin-top:2px;">City Health Officer-II</div>
          <div style="font-size:9.5px;color:#64748b;">CHO1</div>
        </td>
      </tr>
    </table>`;

  // ── One HTML string per page ──────────────────────────────
  return [
    // PAGE 1 — Cover + KPIs + Status & Diseases
    wrap(`
      ${fullHeader}
      ${kpiGrid}
      ${twoCol(
        sectionHeader('Consultations by Status', '#0ea5e9') + dataTable([['Status', '68%'], ['Count', '32%']], tableRows(statusRows, ['Status', 'Total'])),
        sectionHeader('Top Diagnosed Diseases', '#f43f5e') + dataTable([['Disease / Diagnosis', '68%'], ['Cases', '32%']], tableRows(diseaseRows, ['Disease', 'Cases']))
      )}
    `),

    // PAGE 2 — Consultation Volume
    wrap(`
      ${miniHeader('Consultation Volume Report')}
      ${sectionHeader('Consultation Volume by Date', '#8b5cf6')}
      ${dataTable([['Date', '60%'], ['Consultations', '40%']], tableRows(volumeRows, ['Date', 'Consultations']))}
    `),

    // PAGE 3 — Epidemiology & Demographics
    wrap(`
      ${miniHeader('Epidemiological & Population Health Report')}
      ${twoCol(
        sectionHeader('Patient Demographics (Age Group)', '#3b82f6') + dataTable([['Age Group', '68%'], ['Cases', '32%']], tableRows(ageRows, ['Category', 'Cases'])),
        sectionHeader('Case Distribution by Barangay', '#f59e0b') + dataTable([['Barangay', '68%'], ['Cases', '32%']], tableRows(barangayRows, ['Barangay', 'Cases']))
      )}
    `),

    // PAGE 4 — Inventory & Staff
    wrap(`
      ${miniHeader('Inventory & Staff Report')}
      ${twoCol(
        sectionHeader('Low Stock Medicines', '#f59e0b') + dataTable([['Medicine Category', '68%'], ['Count', '32%']], tableRows(lowStockRows, ['Category', 'Low Stock Count'])),
        sectionHeader('Consultations by Doctor', '#10b981') + dataTable([['Doctor Name', '68%'], ['Total Handled', '32%']], tableRows(doctorRows, ['Doctor', 'Consultations']))
      )}
    `),

    // PAGE 4 — Activity Log + Signatures
    wrap(`
      ${miniHeader('System Activity Log')}
      ${sectionHeader('Recent System Activity Log', '#64748b')}
      ${dataTable([['Date & Time', '18%'], ['User', '18%'], ['Role', '12%'], ['Action', '38%'], ['IP', '14%']], tableRows(logRows, ['Date', 'User', 'Role', 'Action', 'IP']))}
      ${signatures}
    `),
  ];
}

export default function Analytics() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('consultations');

  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

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


  const handleExportFullReport = async ({ dateFrom, dateTo } = {}) => {
    setShowExportModal(false);
    setExporting(true);
    try {
      const generatedAt = new Date();

      // Fetch filtered stats if date range provided, otherwise use current stats
      let reportStats = stats;
      if (dateFrom || dateTo) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo)   params.append('date_to',   dateTo);
        try {
          const res = await api.get(`/analytics/stats?${params.toString()}`);
          reportStats = { ...EMPTY_STATS, ...res.data };
        } catch {
          toast.error('Failed to fetch filtered data — exporting full report instead.');
        }
      }

      // Pre-fetch logo as base64 so html2canvas can render it
      let logoDataUrl = null;
      try {
        const resp = await fetch(choLogo);
        const blob = await resp.blob();
        logoDataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch { /* skip logo if unavailable */ }

      const pages = buildReportPages(reportStats, generatedAt, user?.name, logoDataUrl, dateFrom, dateTo);
      const suffix = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : generatedAt.toISOString().slice(0, 10);
      const filename = `cabuyao-cho-analytics-report-${suffix}.pdf`;

      // Render each page HTML independently, stitch into one jsPDF document
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const W_MM = 215.9;
      const H_MM = 279.4;
      const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

      for (let i = 0; i < pages.length; i++) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:816px;height:1056px;border:none;';
        document.body.appendChild(iframe);

        await new Promise((resolve) => {
          iframe.onload = resolve;
          iframe.srcdoc = pages[i];
        });

        await new Promise((r) => setTimeout(r, 300));

        const canvas = await html2canvas(iframe.contentDocument.body, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 816,
          windowWidth: 816,
        });

        document.body.removeChild(iframe);

        const imgData = canvas.toDataURL('image/jpeg', 0.97);
        const ratio = W_MM / canvas.width;
        const imgH = canvas.height * ratio;

        if (i > 0) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, 0, W_MM, Math.min(imgH, H_MM));
      }

      doc.save(filename);
      toast.success('Report exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const doctorMax = maxTotal(stats.consultations_by_doctor);
  const diseaseMax = maxTotal(stats.top_diseases || []);
  const lowStockMax = maxTotal(stats.low_stock_medicines || []);
  const currentMonth = new Date().toLocaleString('en-PH', { month: 'long' });
  const currentMonthYear = new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' });

  const serviceRows = [
    { name: 'Registered Patients', total: summary.registered_patients || 0 },
    { name: 'Active Doctors', total: summary.active_doctors || 0 },
    { name: `Monthly Consults (${currentMonth})`, total: summary.total_consultations || 0 },
    { name: 'Prescriptions Issued', total: summary.prescriptions_issued || 0 },
  ];
  const serviceMax = maxTotal(serviceRows);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={BarChart2} title="Analytics & Reports" description="Generate descriptive analytics reports, health summaries, and service utilization charts." iconClassName="bg-brand-bg text-indigo-600" />
        <button
          data-tour="page-primary-action"
          onClick={() => setShowExportModal(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Monthly Consultations" value={formatNumber(summary.total_consultations)} sub={<>as of <b>{currentMonth}</b> complete consultation</>} color="sky" />
            <StatCard label="Completed" value={formatNumber(getStatusTotal(stats, 'Completed'))} sub="Successfully finished" color="emerald" />
            <StatCard label="Scheduled" value={formatNumber(getStatusTotal(stats, 'Scheduled'))} sub="Upcoming sessions" color="indigo" />
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

      {activeTab === 'epidemiology' && (
        <div className="space-y-6">
            {(() => {
              const topDiagnosis = (stats.top_diseases && stats.top_diseases.length > 0) ? stats.top_diseases[0].diagnosis : 'N/A';
              const topDiagnosisCases = (stats.top_diseases && stats.top_diseases.length > 0) ? stats.top_diseases[0].total : 0;
              const topBarangay = (stats.cases_by_barangay && stats.cases_by_barangay.length > 0) ? stats.cases_by_barangay[0].barangay : 'N/A';
              const topBarangayCases = (stats.cases_by_barangay && stats.cases_by_barangay.length > 0) ? stats.cases_by_barangay[0].total : 0;
              const topDemo = (stats.demographics_by_age && stats.demographics_by_age.length > 0) ? stats.demographics_by_age[0].category : 'N/A';
              const totalBarangays = (stats.cases_by_barangay || []).length;
              
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Top Diagnosis" value={topDiagnosis} sub={topDiagnosis !== 'N/A' ? `${topDiagnosisCases} total reported cases` : 'No data yet'} color="rose" />
                  <StatCard label="Most Affected Area" value={topBarangay} sub={topBarangay !== 'N/A' ? `${topBarangayCases} cases in this barangay` : 'No data yet'} color="amber" />
                  <StatCard label="Primary Demo" value={topDemo} sub="Highest case concentration" color="sky" />
                  <StatCard label="Barangays Covered" value={totalBarangays} sub="Areas with active patients" color="emerald" />
                </div>
              );
            })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-5 flex items-center gap-2"><Users size={16} className="text-sky-500" /> Patient Demographics (by Category)</h3>
              {(stats.demographics_by_age || []).length ? (
                <div className="space-y-3">
                  {stats.demographics_by_age.map((row) => (
                    <BarRow key={row.category} label={row.category} value={row.total} max={Math.max(...stats.demographics_by_age.map(r => Number(r.total)), 1)} color="bg-sky-400" />
                  ))}
                </div>
              ) : <EmptyBlock label="No demographic data yet" />}
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-5 flex items-center gap-2"><Activity size={16} className="text-amber-500" /> Case Distribution by Barangay</h3>
              {(stats.cases_by_barangay || []).length ? (
                <div className="space-y-3">
                  {stats.cases_by_barangay.map((row) => (
                    <BarRow key={row.barangay} label={row.barangay} value={row.total} max={Math.max(...stats.cases_by_barangay.map(r => Number(r.total)), 1)} color="bg-amber-400" />
                  ))}
                </div>
              ) : <EmptyBlock label="No geographic data yet" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} sub="This month" color="emerald" />
            <StatCard label="Low Stock Alerts" value={formatNumber(summary.low_stock_count)} sub="Items needing restock" color="amber" />
            <StatCard label="Top Diseases" value={formatNumber((stats.top_diseases || []).length)} sub="Based on diagnoses" color="indigo" />
            <StatCard label="Active Medicines" value={formatNumber(summary.active_medicines)} sub="Available in inventory" color="rose" />
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
              <h3 className="font-semibold text-text mb-5 flex items-center gap-2"><FileText size={16} className="text-amber-500" /> Low Stock Alerts by Category</h3>
              {(stats.low_stock_medicines || []).length ? (
                <div className="space-y-3">
                  {stats.low_stock_medicines.map((row) => <BarRow key={row.category} label={row.category} value={row.count} max={lowStockMax} color="bg-amber-400" />)}
                </div>
              ) : <EmptyBlock label="No low stock alerts" />}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'utilization' && (
        <div className="space-y-6">

          {/* ── Top Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Registered Patients"
              value={formatNumber(summary.registered_patients)}
              sub="Individuals fully registered for health tracking"
              color="indigo"
            />

            {/* Active Doctors — name + consult count */}
            <div className="p-5 rounded-2xl border border-transparent bg-gradient-to-br from-sky-500 to-blue-600 col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Active Doctors</p>
              <p className="text-3xl font-black mt-1 text-white">{formatNumber(summary.active_doctors)}</p>
              {stats.consultations_by_doctor.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {stats.consultations_by_doctor.map((doc) => (
                    <li key={doc.name} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-white/90 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        {doc.name}
                      </span>
                      <span className="font-bold text-sky-800 shrink-0 bg-white/90 px-1.5 py-0.5 rounded-md">
                        {doc.total} consult{doc.total !== 1 ? 's' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">No consultations recorded</p>
              )}
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs font-semibold text-white/90">Tomorrow</p>
                <p className="text-xs text-white/80 mt-0.5">
                  <span className="font-bold">{formatNumber(summary.active_doctors)}</span> doctor{summary.active_doctors !== 1 ? 's' : ''} available for scheduling
                </p>
              </div>
            </div>

            {/* Monthly Consults — month name bolded */}
            <div className="p-5 rounded-2xl border border-transparent bg-gradient-to-br from-emerald-500 to-teal-600 ">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Monthly Consults</p>
              <p className="text-3xl font-black mt-1 text-white">{formatNumber(summary.total_consultations)}</p>
              <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">
                as of <span className="font-bold">{currentMonth}</span> complete consultation
              </p>
            </div>

            <StatCard
              label="Reminders"
              value={formatNumber(summary.cancelled_consultations)}
              sub="Discontinued consultations"
              color="rose"
            />
          </div>

          {/* ?? Recent System Activity ?? */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-text flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> Recent System Activity
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-hover/50 text-text-muted font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3 min-w-[200px]">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-text">
                  {(stats.recent_logs || []).slice(0, 5).map((log, i) => (
                    <tr key={i} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-text-light text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-text">{log.user || 'System'}</div>
                        {log.role && <div className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">{log.role}</div>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-light text-xs">{log.description}</td>
                    </tr>
                  ))}
                  {(!stats.recent_logs || stats.recent_logs.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-text-muted">No recent activity recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── Export Date Filter Modal ───────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center">
                  <Calendar size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-text text-base">Export Full Report</h2>
                  <p className="text-xs text-text-muted mt-0.5">Filter data by date range</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-text-muted">
                Select a date range to include in the report. Leave both fields empty to export all available data.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">From</label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    max={exportDateTo || undefined}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">To</label>
                  <input
                    type="date"
                    value={exportDateTo}
                    min={exportDateFrom || undefined}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {exportDateFrom && exportDateTo && (
                <div className="flex items-center gap-2 bg-primary-bg border border-sky-200 rounded-xl px-3 py-2.5">
                  <Calendar size={14} className="text-sky-500 shrink-0" />
                  <p className="text-xs text-primary-text">
                    Report will cover <b>{new Date(exportDateFrom).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</b> to <b>{new Date(exportDateTo).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</b>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowExportModal(false); setExportDateFrom(''); setExportDateTo(''); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExportFullReport({ dateFrom: exportDateFrom, dateTo: exportDateTo })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Download size={15} />
                {exportDateFrom || exportDateTo ? 'Export Filtered Report' : 'Export All Data'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
