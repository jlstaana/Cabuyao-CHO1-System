import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import api from '../../utils/api';
import { BarChart2, Activity, Download, TrendingUp, FileText, Users, Clock, Stethoscope, Calendar, X, HeartPulse, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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

function CompactDropdown({ label, value, options, onChange, placeholder = 'All' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOpt = options.find(o => (o.value !== undefined ? String(o.value) : String(o)) === String(value));
  const displayLabel = value ? (selectedOpt?.label || selectedOpt?.value || selectedOpt || value) : placeholder;

  return (
    <div className="relative inline-block" ref={ref}>
      <div className="flex items-center gap-1.5">
        {label && <span className="text-text-muted dark:text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">{label}:</span>}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-slate-800 bg-background dark:bg-slate-950 text-text dark:text-white text-xs font-medium w-36 sm:w-44 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronDown size={13} className={`text-text-light shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 sm:w-56 max-h-60 overflow-y-auto rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
              !value
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-text dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-800'
            }`}
          >
            {placeholder}
          </button>
          {options.map((opt) => {
            const optVal = opt.value !== undefined ? opt.value : opt;
            const optLabel = opt.label !== undefined ? opt.label : opt;
            const isSelected = String(value) === String(optVal);
            return (
              <button
                key={optVal}
                type="button"
                onClick={() => { onChange(optVal); setIsOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium truncate ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-text dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-800'
                }`}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubViewSelector({ options, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2 bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            active === opt.key
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm dark:shadow-none'
              : 'text-text-muted dark:text-slate-400 hover:text-text dark:hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const getStatusTotal = (stats, status) => (
  stats.consultations_by_status.find((item) => item.status === status)?.total || 0
);

const maxTotal = (items) => Math.max(...items.map((item) => Number(item.total || item.count || 0)), 1);

function StatCard({ label, value, sub, color = 'sky' }) {
    const accents = {
      sky: { border: 'border-l-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
      rose: { border: 'border-l-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
      emerald: { border: 'border-l-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
      amber: { border: 'border-l-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
      indigo: { border: 'border-l-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50' }
    };
    const accent = accents[color] || accents.sky;
    const isText = typeof value === 'string' && isNaN(value.replace(/,/g, ''));
    const valueClass = isText 
      ? 'text-lg font-bold text-slate-800 dark:text-slate-100 truncate mt-1' 
      : 'text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5';

    return (
      <div className={`p-5 bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 border-l-4 ${accent.border} shadow-sm transition-all duration-200 hover:shadow-md`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-slate-400">{label}</p>
        <p className={valueClass} title={value}>{value}</p>
        {sub && <p className="text-[10px] mt-1.5 text-text-light dark:text-slate-500 uppercase tracking-wide font-medium">{sub}</p>}
      </div>
    );
  }

function BarRow({ label, value, max, color }) {
    const width = max ? Math.max((Number(value || 0) / max) * 100, value ? 6 : 0) : 0;
    let barColor = color;
    if (!barColor) {
      if (width >= 80) {
        barColor = 'bg-rose-500'; // High workload
      } else if (width >= 40) {
        barColor = 'bg-amber-500'; // Medium
      } else {
        barColor = 'bg-emerald-500'; // Low
      }
    }
    return (
      <div className="flex flex-col gap-1.5 py-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-text dark:text-white font-medium truncate max-w-[200px]">{label}</span>
          <span className="text-text dark:text-white-muted">{formatNumber(value)}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${width}%` }} />
        </div>
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
  
    const topDiagnosis = (stats.top_diseases && stats.top_diseases.length > 0) ? stats.top_diseases[0].diagnosis : 'N/A';
    const topBarangay = (stats.cases_by_barangay && stats.cases_by_barangay.length > 0) ? stats.cases_by_barangay[0].barangay : 'N/A';
    const topDemo = (stats.demographics_by_age && stats.demographics_by_age.length > 0) ? stats.demographics_by_age[0].category : 'N/A';
    const totalBarangays = (stats.cases_by_barangay || []).length;

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
      ${epiKpiGrid}
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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Dynamic colors for Recharts based on active theme
  const chartGridColor = isDark ? '#334155' : '#f1f5f9';
  const chartStrokeColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';
  const [activeTab, setActiveTab] = useState('consultations');

  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [subView, setSubView] = useState('all');
  const [stockPage, setStockPage] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState('');

  useEffect(() => {
    setStockPage(0);
  }, [stats.low_stock_medicines]);

  useEffect(() => {
    setSubView('all');
    setFilterCategory('');
    setFilterAgeGroup('');
    setFilterBarangay('');
    setFilterDoctorId('');
  }, [activeTab]);

  useEffect(() => {
    setSubView('all');
  }, [activeTab]);

  const fetchStats = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDateFrom) params.append('start_date', filterDateFrom + ' 00:00:00');
    if (filterDateTo) params.append('end_date', filterDateTo + ' 23:59:59');
    if (activeTab === 'prescriptions' && filterCategory) params.append('category', filterCategory);
    if (activeTab === 'epidemiology' && filterAgeGroup) params.append('age_group', filterAgeGroup);
    if (activeTab === 'epidemiology' && filterBarangay) params.append('barangay', filterBarangay);
    if (activeTab === 'consultations' && filterDoctorId) params.append('doctor_id', filterDoctorId);

    api.get('/analytics/stats?' + params.toString())
      .then((res) => {
        setStats({ ...EMPTY_STATS, ...res.data });
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => {
        setLoading(false);
      });
  };

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
  const itemsPerPage = 5;
  const paginatedStock = (stats.low_stock_medicines || []).slice(stockPage * itemsPerPage, (stockPage + 1) * itemsPerPage);
  const totalStockPages = Math.ceil((stats.low_stock_medicines || []).length / itemsPerPage);
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

      {/* Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface dark:bg-slate-900 p-3 sm:px-4 rounded-2xl border border-border shadow-sm">
        {/* Left / Date Section */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-text-muted dark:text-slate-400">
            <Calendar size={14} className="text-sky-500 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              {activeTab === 'utilization' ? 'Observation Period' : 'Filter Period'}:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={e => setFilterDateFrom(e.target.value)} 
              max={filterDateTo || undefined} 
              className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-medium text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-28 sm:w-32 cursor-pointer" 
            />
            <span className="text-text-muted dark:text-slate-400 text-xs font-medium">to</span>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={e => setFilterDateTo(e.target.value)} 
              min={filterDateFrom || undefined} 
              className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-medium text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-28 sm:w-32 cursor-pointer" 
            />
          </div>
        </div>

        {/* Right / Context Filter Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'prescriptions' && (stats.categories || []).length > 0 && (
            <CompactDropdown
              label="Category"
              value={filterCategory}
              placeholder="All Categories"
              options={stats.categories}
              onChange={catVal => {
                setFilterCategory(catVal);
                setTimeout(() => {
                  setLoading(true);
                  const params = new URLSearchParams();
                  if (filterDateFrom) params.append('start_date', filterDateFrom + ' 00:00:00');
                  if (filterDateTo) params.append('end_date', filterDateTo + ' 23:59:59');
                  if (catVal) params.append('category', catVal);
                  api.get('/analytics/stats?' + params.toString())
                    .then(res => setStats({ ...EMPTY_STATS, ...res.data }))
                    .finally(() => setLoading(false));
                }, 0);
              }}
            />
          )}

          {activeTab === 'consultations' && (stats.doctors || []).length > 0 && (
            <CompactDropdown
              label="Physician"
              value={filterDoctorId}
              placeholder="All Doctors"
              options={stats.doctors.map(d => ({ value: d.id, label: d.name }))}
              onChange={docVal => {
                setFilterDoctorId(docVal);
                setTimeout(() => {
                  setLoading(true);
                  const params = new URLSearchParams();
                  if (filterDateFrom) params.append('start_date', filterDateFrom + ' 00:00:00');
                  if (filterDateTo) params.append('end_date', filterDateTo + ' 23:59:59');
                  if (docVal) params.append('doctor_id', docVal);
                  api.get('/analytics/stats?' + params.toString())
                    .then(res => setStats({ ...EMPTY_STATS, ...res.data }))
                    .finally(() => setLoading(false));
                }, 0);
              }}
            />
          )}

          {activeTab === 'epidemiology' && (stats.age_groups || []).length > 0 && (
            <CompactDropdown
              label="Age Group"
              value={filterAgeGroup}
              placeholder="All Groups"
              options={stats.age_groups}
              onChange={ageVal => {
                setFilterAgeGroup(ageVal);
                setTimeout(() => {
                  setLoading(true);
                  const params = new URLSearchParams();
                  if (filterDateFrom) params.append('start_date', filterDateFrom + ' 00:00:00');
                  if (filterDateTo) params.append('end_date', filterDateTo + ' 23:59:59');
                  if (ageVal) params.append('age_group', ageVal);
                  if (filterBarangay) params.append('barangay', filterBarangay);
                  api.get('/analytics/stats?' + params.toString())
                    .then(res => setStats({ ...EMPTY_STATS, ...res.data }))
                    .finally(() => setLoading(false));
                }, 0);
              }}
            />
          )}

          {activeTab === 'epidemiology' && (stats.barangays || []).length > 0 && (
            <CompactDropdown
              label="Barangay"
              value={filterBarangay}
              placeholder="All Barangays"
              options={stats.barangays}
              onChange={barVal => {
                setFilterBarangay(barVal);
                setTimeout(() => {
                  setLoading(true);
                  const params = new URLSearchParams();
                  if (filterDateFrom) params.append('start_date', filterDateFrom + ' 00:00:00');
                  if (filterDateTo) params.append('end_date', filterDateTo + ' 23:59:59');
                  if (filterAgeGroup) params.append('age_group', filterAgeGroup);
                  if (barVal) params.append('barangay', barVal);
                  api.get('/analytics/stats?' + params.toString())
                    .then(res => setStats({ ...EMPTY_STATS, ...res.data }))
                    .finally(() => setLoading(false));
                }, 0);
              }}
            />
          )}

          <div className="flex items-center gap-2">
            {(filterDateFrom || filterDateTo || filterCategory || filterDoctorId || filterAgeGroup || filterBarangay) && (
              <button 
                onClick={() => { 
                  setFilterDateFrom(''); setFilterDateTo(''); setFilterCategory(''); setFilterDoctorId(''); setFilterAgeGroup(''); setFilterBarangay('');
                  setTimeout(() => {
                    setLoading(true);
                    api.get('/analytics/stats').then(res => setStats({ ...EMPTY_STATS, ...res.data })).finally(() => setLoading(false));
                  }, 0);
                }} 
                className="text-xs font-semibold text-text-muted dark:text-slate-400 hover:text-rose-500 transition-colors px-2 py-1"
              >
                Reset
              </button>
            )}
            <button 
              onClick={fetchStats} 
              disabled={loading}
              className="bg-sky-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'consultations' && (
        <div data-tour="page-stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Consultations" value={formatNumber(summary.total_consultations)} sub={filterDateFrom || filterDateTo || filterDoctorId ? 'For selected filter criteria' : <>as of <b>{currentMonth}</b> consultations</>} color="sky" />
            <StatCard label="Completed" value={formatNumber(getStatusTotal(stats, 'Completed'))} sub="Successfully finished" color="emerald" />
            <StatCard label="Scheduled" value={formatNumber(getStatusTotal(stats, 'Scheduled'))} sub="Upcoming sessions" color="indigo" />
          </div>

          <SubViewSelector
            active={subView}
            onChange={setSubView}
            options={[
              { key: 'all', label: 'All Charts' },
              { key: 'volume', label: 'Daily Volume' },
              { key: 'doctor', label: 'By Doctor' }
            ]}
          />

          <div className={`grid gap-6 ${subView === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(subView === 'all' || subView === 'volume') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                <h3 className="font-semibold text-text dark:text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-sky-500" /> Daily Consultation Volume</h3>
                {stats.time_based_volume.length ? (
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.time_based_volume}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                        <XAxis dataKey="date" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                        <Area type="monotone" dataKey="count" name="Consultations" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyBlock label="No consultation volume yet" />}
              </div>
            )}

            {(subView === 'all' || subView === 'doctor') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                <h3 className="font-semibold text-text dark:text-white mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-500" /> By Doctor</h3>
                {stats.consultations_by_doctor.length ? (
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.consultations_by_doctor} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                        <XAxis type="number" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
                        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                        <Bar dataKey="total" name="Consultations" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyBlock label="No doctor consultation data yet" />}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'epidemiology' && (
        <div className="space-y-4">
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

          <SubViewSelector
            active={subView}
            onChange={setSubView}
            options={[
              { key: 'all', label: 'All Charts' },
              { key: 'demographics', label: 'Demographics' },
              { key: 'barangay', label: 'By Barangay' }
            ]}
          />

          <div className={`grid gap-6 ${subView === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(subView === 'all' || subView === 'demographics') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                <h3 className="font-semibold text-text dark:text-white mb-5 flex items-center gap-2"><Users size={16} className="text-sky-500" /> Patient Demographics (by Category)</h3>
                {(stats.demographics_by_age || []).length ? (
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.demographics_by_age} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                        <XAxis type="number" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="category" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
                        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                        <Bar dataKey="total" name="Cases" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyBlock label="No demographic data yet" />}
              </div>
            )}

            {(subView === 'all' || subView === 'barangay') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                <h3 className="font-semibold text-text dark:text-white mb-5 flex items-center gap-2"><Activity size={16} className="text-amber-500" /> Case Distribution by Barangay</h3>
                {(stats.cases_by_barangay || []).length ? (
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.cases_by_barangay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                        <XAxis dataKey="barangay" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                        <Bar dataKey="total" name="Cases" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyBlock label="No geographic data yet" />}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Prescriptions Issued" value={formatNumber(summary.prescriptions_issued)} sub={filterDateFrom || filterDateTo || filterCategory ? 'For selected criteria' : 'This month'} color="emerald" />
            <StatCard label="Low Stock Alerts" value={formatNumber(summary.low_stock_count)} sub={filterCategory ? `In ${filterCategory}` : 'Items needing restock'} color="amber" />
            <StatCard label="Top Diseases" value={formatNumber((stats.top_diseases || []).length)} sub="Based on diagnoses" color="indigo" />
            <StatCard label="Active Medicines" value={formatNumber(summary.active_medicines)} sub={filterCategory ? `${filterCategory} in stock` : 'Available in inventory'} color="rose" />
          </div>

          <SubViewSelector
            active={subView}
            onChange={setSubView}
            options={[
              { key: 'all', label: 'All Charts' },
              { key: 'diseases', label: 'Top Diseases' },
              { key: 'stock', label: 'Low Stock' }
            ]}
          />

          <div className={`grid gap-6 ${subView === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {(subView === 'all' || subView === 'diseases') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                <h3 className="font-semibold text-text dark:text-white mb-5 flex items-center gap-2"><FileText size={16} className="text-emerald-500" /> Top Diagnosed Diseases</h3>
                {(stats.top_diseases || []).length ? (
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.top_diseases} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                        <XAxis type="number" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="diagnosis" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
                        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                        <Bar dataKey="total" name="Cases" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyBlock label="No disease diagnosis data yet" />}
              </div>
            )}

            {(subView === 'all' || subView === 'stock') && (
              <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-text dark:text-white mb-1 flex items-center gap-2">
                    <FileText size={16} className="text-amber-500" /> Low Stock Alerts by Category
                  </h3>
                  <p className="text-xs text-text-light mb-4">Medicines near or below threshold limit.</p>
                  {(stats.low_stock_medicines || []).length ? (
                    <div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={paginatedStock} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                            <XAxis type="number" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="category" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
                            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                            <Bar dataKey="count" name="Low Stock Items" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {(stats.low_stock_medicines || []).length > 0 && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                          <button
                            disabled={stockPage === 0}
                            onClick={() => setStockPage(prev => Math.max(0, prev - 1))}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition"
                            title="Previous Page"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-xs font-bold text-text-muted">
                            Page {stockPage + 1} of {Math.max(totalStockPages, 1)}
                          </span>
                          <button
                            disabled={stockPage >= totalStockPages - 1}
                            onClick={() => setStockPage(prev => Math.min(totalStockPages - 1, prev + 1))}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition"
                            title="Next Page"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : <EmptyBlock label="No low stock alerts" />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'utilization' && (
          <div className="space-y-4">

            {/* "?"? Top Stat Cards "?"? */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Registered Patients" value={formatNumber(summary.registered_patients)} sub="Individuals fully registered for health tracking" color="indigo" />
              <StatCard label="Active Doctors" value={formatNumber(summary.active_doctors)} sub="Available for scheduling" color="sky" />
              <StatCard label="Monthly Consults" value={formatNumber(summary.total_consultations)} sub={<>as of <b>{currentMonth}</b> complete consultation</>} color="emerald" />
              <StatCard label="Reminders" value={formatNumber(summary.cancelled_consultations)} sub="Discontinued consultations" color="rose" />
            </div>

            <SubViewSelector
              active={subView}
              onChange={setSubView}
              options={[
                { key: 'all', label: 'All Charts' },
                { key: 'peak', label: 'Peak Hours' },
                { key: 'workload', label: 'Workload & Tomorrow' }
              ]}
            />

            {/* Peak Activity & Workload Distribution */}
            <div className={`grid gap-6 mb-6 ${subView === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {(subView === 'all' || subView === 'peak') && (
                <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                  <h3 className="font-semibold text-text dark:text-white mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" /> Peak Utilization Hours
                  </h3>
                  <p className="text-xs text-text-light mb-5">Consultation traffic volume grouped by hour of the day.</p>
                  {(stats.peak_hours || []).length > 0 ? (
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.peak_hours}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                          <XAxis dataKey="hour" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                          <Bar dataKey="count" name="Consultations" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyBlock label="No hourly utilization data yet" />}
                </div>
              )}

              {(subView === 'all' || subView === 'workload') && (
                <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-6 min-w-0">
                  <h3 className="font-semibold text-text dark:text-white mb-2 flex items-center gap-2">
                    <Stethoscope size={16} className="text-sky-500" /> Doctor Workload Distribution
                  </h3>
                  <p className="text-xs text-text-light mb-5">Total assigned consultations distributed across active doctors.</p>
                  {(stats.consultations_by_doctor || []).length > 0 ? (
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.consultations_by_doctor} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                          <XAxis type="number" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" stroke={chartStrokeColor} fontSize={11} tickLine={false} axisLine={false} width={100} />
                          <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '12px', color: tooltipTextColor }} itemStyle={{ color: tooltipTextColor }} />
                          <Bar dataKey="total" name="Consultations" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyBlock label="No doctor workload data yet" />}
                  <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-sm font-semibold text-text dark:text-white mb-2">Tomorrow's Shift</p>
                    {(stats.tomorrow_doctors || []).length > 0 ? (
                      <ul className="space-y-2">
                        {stats.tomorrow_doctors.map(doc => (
                          <li key={doc.name} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-text dark:text-white">{doc.name}</span>
                            <span className="text-text dark:text-white-muted bg-surface-hover px-2 py-1 rounded-md">{doc.schedule}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-text-muted">No doctors are scheduled for tomorrow.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Consultation Pulse */}
            <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-text dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> Live Consultation Pulse
                </h3>
                <p className="text-xs text-text-light mt-1">Real-time feed of the latest consultation updates across the system.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface dark:bg-slate-900-hover/50 text-text-muted font-medium border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Latest Update</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Attending Doctor</th>
                      <th className="px-6 py-3 font-semibold">Patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800">
                    {(stats.recent_consultations || []).length > 0 ? (
                      stats.recent_consultations.map((c, i) => (
                        <tr key={i} className="hover:bg-surface-hover/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-text-light dark:text-slate-400 text-xs">
                            <span className="font-medium text-text dark:text-white">{c.time}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Scheduled' ? 'bg-sky-50 text-sky-700' : 'bg-slate-50 text-slate-700'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="font-medium text-text dark:text-white">{c.doctor}</div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-text-light font-medium">
                            {c.patient}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-text-muted">No recent consultations found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Export Date Filter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">

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
