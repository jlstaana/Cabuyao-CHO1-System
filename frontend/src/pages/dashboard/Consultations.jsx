import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';
import {
  Video, Calendar, Clock, CheckCircle, XCircle,
  Stethoscope, FilePlus, AlertCircle, Plus, Settings, Save, Trash2, Download, FileText, HeartPulse, Search, X,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  Pending:   { pill: 'bg-amber-50 text-amber-700 border-amber-200 border shadow-sm',   dot: 'bg-amber-500',   icon: Clock },
  Scheduled: { pill: 'bg-sky-50 text-sky-700 border-sky-200 border shadow-sm',       dot: 'bg-sky-500',     icon: Calendar },
  Completed: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 border shadow-sm', dot: 'bg-emerald-500', icon: CheckCircle },
  Cancelled: { pill: 'bg-slate-50 text-text-muted border-slate-200 border shadow-sm',   dot: 'bg-slate-400',   icon: XCircle },
};

const TAB_ICON = {
  All: Stethoscope,
  Pending: Clock,
  Scheduled: Calendar,
  Completed: CheckCircle,
  Cancelled: XCircle,
};

const DEFAULT_SPECIALIZATIONS = [
  'General Medicine',
  'Cardio',
  'Pulmo',
  'Mental',
  'Endo',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_AVAILABILITY_SLOT = {
  day_of_week: 'Monday',
  start_time: '08:00',
  end_time: '12:00',
};

const EMPTY_REQUEST_FORM = {
  requested_specialization: '',
  doctor_id: null,
  scheduled_at: '',
  symptoms: '',
  notes: '',
  vitals: {
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    respiratory: '',
    oxygen: '',
    weight: '',
  },
};

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

const FILTER_STYLES = {
  All: {
    active: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-indigo-200 shadow-md',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-indigo-100',
    labelActive: 'text-indigo-100',
  },
  Pending: {
    active: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-amber-200 shadow-md',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-amber-100',
    labelActive: 'text-amber-100',
  },
  Scheduled: {
    active: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent shadow-sky-200 shadow-md',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-sky-100',
    labelActive: 'text-sky-100',
  },
  Completed: {
    active: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-emerald-200 shadow-md',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-emerald-100',
    labelActive: 'text-emerald-100',
  },
  Cancelled: {
    active: 'bg-gradient-to-br from-slate-500 to-gray-600 text-white border-transparent shadow-slate-200 shadow-md',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-slate-100',
    labelActive: 'text-slate-100',
  }
};

function InteractiveStatCard({ status, label, count, sub }) {
  const styles = FILTER_STYLES[status] || FILTER_STYLES.All;
  const Icon = TAB_ICON[status] || Stethoscope;
  const displayLabel = label || status;
  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm ${styles.active}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${styles.labelActive}`}>
          {displayLabel}
        </span>
        <div className={`p-2 rounded-xl ${styles.iconActive}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-2xl font-black ${styles.textActive}`}>
        {count}
      </p>
      <p className={`text-[10px] mt-1 uppercase tracking-wide ${styles.subActive}`}>
        {sub}
      </p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="col-span-full py-16 text-center bg-surface rounded-2xl border border-border shadow-sm">
      <Stethoscope size={36} className="mx-auto mb-3 text-text-light opacity-60" />
      <p className="font-semibold text-text-muted">{message}</p>
    </div>
  );
}

function fullName(user) {
  return user?.name || 'Unknown Patient';
}

function formatPatientAge(dob) {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} yrs`;
}

function fileName(file) {
  return file.original_name || file.file_path?.split('/').pop() || `Medical file #${file.id}`;
}

function dateFromInput(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function startOfWeek(value) {
  const date = dateFromInput(value);
  const dayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateTimeLocalValue(date, time = '08:00') {
  const next = new Date(date);
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  const pad = (value) => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

function dayName(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function shortDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeRangeLabel(slot) {
  return `${String(slot.start_time).slice(0, 5)}-${String(slot.end_time).slice(0, 5)}`;
}

function availabilityLabel(availability = []) {
  if (!availability.length) {
    return 'Available without fixed weekly schedule';
  }

  return availability
    .map((slot) => `${String(slot.day_of_week).slice(0, 3)} ${timeRangeLabel(slot)}`)
    .join(', ');
}

function dateKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function doctorSlotStatus(doctor, date, slot) {
  const booked = (doctor.booked_slots || []).find((booked) => (
    booked.date === dateKey(date)
    && booked.day_of_week === slot.day_of_week
    && String(booked.start_time).slice(0, 5) === String(slot.start_time).slice(0, 5)
    && String(booked.end_time).slice(0, 5) === String(slot.end_time).slice(0, 5)
  ));

  const capacity = booked?.capacity || doctor.slot_capacity || 18;
  const bookedCount = booked?.booked_count || 0;
  const remaining = Math.max((booked?.remaining ?? (capacity - bookedCount)), 0);

  return {
    capacity,
    bookedCount,
    remaining,
    isFull: Boolean(booked?.is_full) || remaining <= 0,
  };
}

// ─── PATIENT VIEW ─────────────────────────────────────────────────────────────
function PatientView({ consultations, loading, onRequest, onReschedule, onCancel }) {
  const tabs = ['All', 'Pending', 'Scheduled', 'Completed'];
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = consultations.filter(c => {
    const matchTab = tab === 'All' || c.status === tab;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || c.doctor?.user?.name?.toLowerCase().includes(q)
      || c.requested_specialization?.toLowerCase().includes(q)
      || (c.status || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  }).sort((a, b) => {
    if (tab === 'Completed') return new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at);
    return new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
  });

  return (
    <div className="space-y-6">
      {/* CTA banner */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-lg dark:shadow-none shadow-sky-200">
        <div>
          <h2 className="text-lg font-bold">Need to see a doctor?</h2>
          <p className="text-sky-100 text-sm mt-0.5">Submit a teleconsultation request and a doctor will be assigned to you.</p>
        </div>
        <button
          data-tour="page-primary-action"
          onClick={onRequest}
          className="flex items-center gap-2 bg-surface text-primary-text px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-bg transition-colors shadow-sm flex-shrink-0 active:scale-95"
        >
          <Plus size={18} /> Request Teleconsult
        </button>
      </div>

      {/* Search & Status tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => {
            const Icon = TAB_ICON[t] || Stethoscope;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'}`}
              ><Icon size={14} /> {t}</button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search doctor or specialization..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all shrink-0"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse">
            <div className="h-5 bg-surface-hover rounded w-40 mb-3" /><div className="h-4 bg-surface-hover/50 rounded w-64" />
          </div>
        )) : filtered.length === 0 ? <EmptyState message={tab === 'All' ? 'No consultations yet.' : `No ${tab.toLowerCase()} consultations.`} />
        : filtered.map(c => {
          const cfg = STATUS[c.status] || STATUS.Pending;
          return (
            <div key={c.id} className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot} hidden sm:block`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-text">
                    {c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\.\s*/i, '')}` : 'Doctor to be assigned'}
                  </p>
                  <StatusPill status={c.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-text-light">
                  {c.requested_specialization && <span className="flex items-center gap-1"><Stethoscope size={12} /> {c.requested_specialization}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> Requested: {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={12} /> {c.status === 'Pending' ? 'Preferred' : 'Scheduled'}: {new Date(c.scheduled_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0 mt-3 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
                {['Pending', 'Scheduled'].includes(c.status) && (
                  <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-4 py-2 bg-danger-bg text-danger-text rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                    <XCircle size={16} /> Cancel
                  </button>
                )}
                {c.status === 'Scheduled' && (
                  <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-4 py-2 bg-primary-bg text-primary-text rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
                    <Calendar size={16} /> Reschedule
                  </button>
                )}
                {c.status === 'Scheduled' && (
                  <Link to={`/room/${c.id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm">
                    <Video size={16} /> Join Now
                  </Link>
                )}
                {c.status === 'Completed' && (
                  <Link to="/prescriptions" className="flex items-center gap-2 px-4 py-2 bg-success-bg text-success-text rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                    <FilePlus size={16} /> View Rx
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DOCTOR VIEW ──────────────────────────────────────────────────────────────
function DoctorView({ consultations, loading, onAccept, onReview, onReschedule, onCancel, availabilityStatus, onOpenAvailability }) {
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');

  const pending   = consultations.filter(c => c.status === 'Pending');
  const scheduled = consultations.filter(c => c.status === 'Scheduled');
  const completed = consultations.filter(c => c.status === 'Completed');

  const counts = { Pending: pending.length, Scheduled: scheduled.length, Completed: completed.length };
  const baseFiltered = tab === 'Pending' ? pending : tab === 'Scheduled' ? scheduled : completed;

  const filtered = baseFiltered.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.patient?.user?.name?.toLowerCase().includes(q) ||
      (c.form?.symptoms || '').toLowerCase().includes(q) ||
      (c.form?.diagnosis || '').toLowerCase().includes(q) ||
      `cn-${String(c.id).padStart(6, '0')}`.includes(q)
    );
  }).sort((a, b) => {
    if (tab === 'Completed') return new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at);
    return new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
  });

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      {availabilityStatus ? (
        <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${availabilityStatus.is_available_now ? 'bg-success-bg border-emerald-200 text-success-text' : 'bg-warning-bg border-amber-200 text-warning-text'}`}>
          <div className="flex items-center gap-2 font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full ${availabilityStatus.is_available_now ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {availabilityStatus.doctor_type || 'Resident'} doctor · {availabilityStatus.is_available_now ? 'Active and on schedule now' : 'Active but outside scheduled hours'}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="text-xs font-medium opacity-80">{availabilityStatus.scheduleLabel || 'No fixed schedule set'}</p>
            <button
              data-tour="page-primary-action"
              onClick={onOpenAvailability}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface/80 px-3 py-1.5 text-xs font-bold text-text-muted hover:bg-surface transition-colors"
            >
              <Settings size={13} /> Availability Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-text">Availability settings</p>
            <p className="text-xs text-text-light mt-0.5">Set your doctor type, available days, and time slots.</p>
          </div>
          <button
            data-tour="page-primary-action"
            onClick={onOpenAvailability}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-bg px-4 py-2 text-sm font-bold text-primary-text hover:bg-primary-hover transition-colors"
          >
            <Settings size={15} /> Open Settings
          </button>
        </div>
      )}

      {/* Summary strip / Filter cards */}
      <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Pending', status: 'Pending', count: pending.length, sub: 'Needs review' },
          { label: 'Scheduled', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished' },
        ].map(s => (
          <InteractiveStatCard
            key={s.label}
            status={s.status}
            label={s.label}
            count={s.count}
            sub={s.sub}
          />
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          {['Pending', 'Scheduled', 'Completed'].map(t => {
            const Icon = TAB_ICON[t] || Stethoscope;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'}`}
              >
                <Icon size={14} /> {t}
                {counts[t] > 0 && t === 'Pending' && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{counts[t]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name or symptoms..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all shrink-0"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-text-muted mt-3">
          Showing <span className="font-semibold text-text">{filtered.length}</span> of <span className="font-semibold text-text">{consultations.length}</span> consultations
        </p>
      )}

      {/* Queue list */}
      <div data-tour="page-list" className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="font-semibold text-text-muted">{tab === 'Pending' ? 'No pending request.' : `No ${tab.toLowerCase()} consultations.`}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((c, i) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-background/60 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Queue number */}
                <div className="w-9 h-9 rounded-xl bg-surface-hover/50 text-text-muted flex items-center justify-center font-black text-sm flex-shrink-0">
                  {i + 1}
                </div>
                {/* Patient avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-bg text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                  {(c.patient?.user?.name || 'P').charAt(0)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">{c.patient?.user?.name || 'Unknown Patient'}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-text-light mt-0.5">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(c.created_at).toLocaleDateString()}</span>
                    {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={11} /> {c.status === 'Pending' ? 'Preferred' : 'Scheduled'}: {new Date(c.scheduled_at).toLocaleString()}</span>}
                  </div>
                </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                  {c.status === 'Pending' && (
                    <>
                      <span className="text-xs text-amber-600 bg-warning-bg border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                        Awaiting doctor
                      </span>
                      <button onClick={() => onReview(c)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-bg text-primary-text rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
                        <FileText size={15} /> Review
                      </button>
                      <button onClick={() => onAccept(c)} className="flex items-center gap-1.5 px-3 py-2 bg-success-bg text-success-text rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                        <CheckCircle size={15} /> Accept
                      </button>
                      <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-2 bg-danger-bg text-danger-text rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                        <XCircle size={15} /> Cancel
                      </button>
                    </>
                  )}
                  {c.status === 'Scheduled' && (
                    <>
                      <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-bg text-primary-text rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
                        <Calendar size={15} /> Reschedule
                      </button>
                      <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-2 bg-danger-bg text-danger-text rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
                        <XCircle size={15} /> Cancel
                      </button>
                      <Link to={`/room/${c.id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm">
                        <Video size={16} /> Join Call
                      </Link>
                    </>
                  )}
                  {c.status === 'Completed' && (
                    <Link to="/prescriptions" className="flex items-center gap-2 px-4 py-2 bg-success-bg text-success-text rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                      <FilePlus size={16} /> E-Prescribe
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN / STAFF VIEW ───────────────────────────────────────────────────────
function AdminView({ consultations, loading, onReschedule, onCancel }) {
  const [tab, setTab] = useState('Scheduled');
  const [search, setSearch] = useState('');

  const filtered = consultations.filter(c => {
    const matchTab = c.status === tab;
    const q = search.trim().toLowerCase();
    if (!q) return matchTab;
    const matchSearch =
      c.patient?.user?.name?.toLowerCase().includes(q) ||
      c.doctor?.user?.name?.toLowerCase().includes(q) ||
      `cn-${String(c.id).padStart(6, '0')}`.includes(q);
    return matchTab && matchSearch;
  }).sort((a, b) => {
    if (tab === 'Completed' || tab === 'Cancelled') return new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at);
    return new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div data-tour="page-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { status: 'Pending', sub: 'Awaiting assignment' },
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Successfully finished' },
          { status: 'Cancelled', sub: 'Discontinued requests' }
        ].map(s => (
          <InteractiveStatCard
            key={s.status}
            status={s.status}
            label={s.status}
            count={consultations.filter(c => c.status === s.status).length}
            sub={s.sub}
          />
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Pending','Scheduled','Completed','Cancelled'].map(t => {
            const Icon = TAB_ICON[t] || Stethoscope;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'}`}
              ><Icon size={14} /> {t} ({consultations.filter(c => c.status === t).length})</button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or assigned doctor..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-danger-bg text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all shrink-0"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-text-muted -mt-3">
          Showing <span className="font-semibold text-text">{filtered.length}</span> of <span className="font-semibold text-text">{consultations.length}</span> consultations
        </p>
      )}

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-text-light opacity-60" />
            <p className="font-semibold text-text-muted">No {tab.toLowerCase()} consultations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table data-tour="page-list" className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-background text-text-muted text-xs border-b border-border">
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor Assigned</th>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-5 py-3 font-semibold">Scheduled</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-bg text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(c.patient?.user?.name || 'P').charAt(0)}
                        </div>
                        <span className="font-semibold text-text">{c.patient?.user?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\.\s*/i, '')}` : <span className="text-text-light opacity-60 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-text-light">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-text-light">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {c.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-bg text-danger-text rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                            <XCircle size={13} /> Cancel
                          </button>
                        </div>
                      )}
                      {c.status === 'Scheduled' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onReschedule(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-bg text-primary-text rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors">
                            <Calendar size={13} /> Reschedule
                          </button>
                          <button onClick={() => onCancel(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-bg text-danger-text rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                            <XCircle size={13} /> Cancel
                          </button>
                          <Link to={`/room/${c.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg text-brand-text rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                            <Video size={13} /> Monitor
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Consultations() {
  const { user } = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ doctor_id: '', scheduled_at: '' });
  const [specializations, setSpecializations] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
  const [availabilityForm, setAvailabilityForm] = useState({
    doctor_type: 'Resident',
    availability: [{ ...EMPTY_AVAILABILITY_SLOT }],
  });

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations');
      setConsultations(res.data);
    } catch { toast.error('Failed to load consultations'); }
    finally   { setLoading(false); }
  };

  useEffect(() => {
    let isActive = true;
    api.get('/consultations')
      .then(res => {
        if (isActive) setConsultations(res.data);
      })
      .catch(() => toast.error('Failed to load consultations'))
      .finally(() => {
        if (isActive) setLoading(false);
      });
    if (user?.role === 'Admin' || user?.role === 'Staff') {
      api.get('/admin/users')
        .then(res => {
          if (isActive) setDoctors(res.data.filter(u => u.role === 'Doctor'));
        })
        .catch(console.error);
    }
    if (user?.role === 'Patient') {
      api.get('/doctors/specializations')
        .then(res => {
          if (isActive) {
            const rows = res.data || [];
            setSpecializations(rows);
            const options = Array.from(new Set([...DEFAULT_SPECIALIZATIONS, ...rows]));
            setSpecializations(options);
            setRequestForm((form) => ({ ...form, requested_specialization: form.requested_specialization || options[0] || 'General Medicine' }));
          }
        })
        .catch(() => {
          if (isActive) setSpecializations(DEFAULT_SPECIALIZATIONS);
        });
    }
    if (user?.role === 'Patient' || user?.role === 'Doctor' || user?.role === 'Admin' || user?.role === 'Staff') {
      api.get('/doctors/available')
        .then(res => {
          if (isActive) setAvailableDoctors(res.data || []);
        })
        .catch(console.error);
    }
    return () => { isActive = false; };
  }, [user]);

  const handleRequest = () => {
    setRequestModal(true);
  };

  const updateRequestVital = (key, value) => {
    setRequestForm((form) => ({
      ...form,
      vitals: {
        ...form.vitals,
        [key]: value,
      },
    }));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/consultations/request', requestForm);
      toast.success(response.data?.message || (response.data?.doctor_id ? 'Consultation scheduled with an available doctor!' : 'Request queued for coordination.'));
      setRequestModal(false);
      setRequestForm({
        ...EMPTY_REQUEST_FORM,
        requested_specialization: requestForm.requested_specialization,
      });
      fetchConsultations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to request consultation'); }
  };

  const handleReschedule = (c) => {
    setSelected(c);
    setRescheduleForm({
      doctor_id: c.doctor_id || c.doctor?.id || '',
      scheduled_at: c.scheduled_at ? new Date(c.scheduled_at).toISOString().slice(0, 16) : '',
    });
    setReviewModal(false);
    setRescheduleModal(true);
  };

  const handleReview = (c) => {
    setSelected(c);
    setReviewModal(true);
  };

  const handleAccept = async (c) => {
    try {
      await api.post(`/consultations/${c.id}/status`, {
        status: 'Scheduled',
        scheduled_at: c.scheduled_at || new Date().toISOString().slice(0, 16),
      });
      toast.success('Consultation accepted. Patient has been notified.');
      setReviewModal(false);
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept consultation');
    }
  };

  const handleCancel = async (c) => {
    if (!window.confirm(`Cancel consultation for ${c.patient?.user?.name || 'this patient'}?`)) return;
    try {
      await api.post(`/consultations/${c.id}/status`, { status: 'Cancelled' });
      toast.success('Consultation cancelled.');
      fetchConsultations();
    } catch {
      toast.error('Failed to cancel consultation');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/consultations/${selected.id}/status`, {
        status: 'Scheduled',
        ...rescheduleForm,
      });
      toast.success('Consultation rescheduled. Patient has been notified.');
      setRescheduleModal(false);
      setReviewModal(false);
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule consultation');
    }
  };

  // Page title per role
  const titles = {
    Patient: { h1: 'My Consultations', sub: 'Track your requests and join your scheduled teleconsultation.' },
    Doctor:  { h1: 'Consultation Queue', sub: 'Review incoming requests and manage your patient sessions.' },
    Admin:   { h1: 'All Consultations', sub: 'Monitor doctor-managed schedules and consultation sessions.' },
    Staff:   { h1: 'All Consultations', sub: 'Monitor doctor-managed schedules and consultation sessions.' },
  };

  const openAvailabilitySettings = () => {
    const current = currentDoctorAvailability;
    setAvailabilityForm({
      doctor_type: current?.doctor_type || 'Resident',
      availability: current?.availability?.length
        ? current.availability.map((slot) => ({
            day_of_week: slot.day_of_week,
            start_time: String(slot.start_time || '08:00').slice(0, 5),
            end_time: String(slot.end_time || '12:00').slice(0, 5),
          }))
        : [{ ...EMPTY_AVAILABILITY_SLOT }],
    });
    setAvailabilityModal(true);
  };

  const updateAvailabilitySlot = (index, key, value) => {
    setAvailabilityForm((form) => ({
      ...form,
      availability: form.availability.map((slot, slotIndex) => (
        slotIndex === index ? { ...slot, [key]: value } : slot
      )),
    }));
  };

  const addAvailabilitySlot = () => {
    setAvailabilityForm((form) => ({
      ...form,
      availability: [...form.availability, { ...EMPTY_AVAILABILITY_SLOT }],
    }));
  };

  const removeAvailabilitySlot = (index) => {
    setAvailabilityForm((form) => ({
      ...form,
      availability: form.availability.filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/doctor/availability', availabilityForm);
      toast.success(response.data?.message || 'Availability settings saved.');
      setAvailabilityModal(false);
      const res = await api.get('/doctors/available');
      setAvailableDoctors(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid schedule. Please review your entries.');
    }
  };

  const handleDownloadMedicalFile = async (file) => {
    try {
      const response = await api.get(`/medical-images/${file.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: file.mime_type || 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName(file);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };
  const title = titles[user?.role] || titles.Patient;
  const currentDoctorStatus = availableDoctors.find((doctor) => doctor.user_id === user?.id);
  const currentDoctorAvailability = currentDoctorStatus ? {
    ...currentDoctorStatus,
    scheduleLabel: currentDoctorStatus.availability?.length
      ? currentDoctorStatus.availability.map((slot) => `${slot.day_of_week.slice(0, 3)} ${slot.start_time}-${slot.end_time}`).join(', ')
      : 'Available without fixed schedule',
  } : null;
  const matchingAvailableDoctors = availableDoctors.filter((doctor) => doctor.specialization === requestForm.requested_specialization);
  const requestWeekStart = startOfWeek(requestForm.scheduled_at);
  const requestWeekDays = Array.from({ length: 7 }, (_, index) => addDays(requestWeekStart, index));
  const requestSelectedDate = requestForm.scheduled_at ? new Date(requestForm.scheduled_at) : null;
  const requestSelectedDateKey = requestSelectedDate && !Number.isNaN(requestSelectedDate.getTime()) ? requestSelectedDate.toDateString() : '';
  const requestSelectedTime = requestForm.scheduled_at ? requestForm.scheduled_at.slice(11, 16) : '';
  const rescheduleDoctorId = rescheduleForm.doctor_id || selected?.doctor_id || selected?.doctor?.id;
  const rescheduleDoctor = availableDoctors.find((doctor) => String(doctor.id) === String(rescheduleDoctorId));
  const rescheduleWeekStart = startOfWeek(rescheduleForm.scheduled_at);
  const rescheduleWeekDays = Array.from({ length: 7 }, (_, index) => addDays(rescheduleWeekStart, index));
  const selectedDateTime = rescheduleForm.scheduled_at ? new Date(rescheduleForm.scheduled_at) : null;
  const selectedDateKey = selectedDateTime && !Number.isNaN(selectedDateTime.getTime()) ? selectedDateTime.toDateString() : '';
  const selectedTime = rescheduleForm.scheduled_at ? rescheduleForm.scheduled_at.slice(11, 16) : '';
  const rescheduleAvailability = rescheduleDoctor?.availability || [];
  const rescheduleDoctorName = rescheduleDoctor?.name || selected?.doctor?.user?.name;
  const rescheduleWeekSchedule = rescheduleWeekDays.map((date) => ({
    date,
    slots: rescheduleAvailability
      .filter((slot) => slot.day_of_week === dayName(date))
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">      <header>
        <PageTitle icon={Stethoscope} title={title.h1} description={title.sub} iconClassName="bg-primary-bg text-primary-text" />
      </header>

      {user?.role === 'Patient' && <PatientView consultations={consultations} loading={loading} onRequest={handleRequest} onReschedule={handleReschedule} onCancel={handleCancel} />}
      {user?.role === 'Doctor'  && <DoctorView consultations={consultations} loading={loading} onAccept={handleAccept} onReview={handleReview} onReschedule={handleReschedule} onCancel={handleCancel} availabilityStatus={currentDoctorAvailability} onOpenAvailability={openAvailabilitySettings} />}
      {(user?.role === 'Admin' || user?.role === 'Staff') && (
        <AdminView consultations={consultations} loading={loading} onReschedule={handleReschedule} onCancel={handleCancel} />
      )}

      {/* Doctor Consultation Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Review Consultation Request">
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-text-light">Patient</p>
                  <h3 className="text-lg font-bold text-text">{fullName(selected.patient?.user)}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
                    <span>Age: {formatPatientAge(selected.patient?.dob)}</span>
                    <span>Contact: {selected.patient?.contact_no || 'N/A'}</span>
                    <span>Requested: {selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
                <StatusPill status={selected.status} />
              </div>
              {selected.patient?.address && (
                <p className="mt-2 text-xs text-text-muted">Address: {selected.patient.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
                  <Stethoscope size={15} className="text-primary-text" /> Reason for Consultation
                </p>
                <p className="text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
                  {selected.form?.symptoms || 'No consultation reason provided.'}
                </p>
                {selected.form?.notes && (
                  <p className="mt-3 rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-text-muted whitespace-pre-wrap">
                    {selected.form.notes}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <HeartPulse size={15} className="text-danger-text" /> Vital Signs
                </p>
                {selected.vital_signs || selected.vitalSigns ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ['BP', (selected.vital_signs || selected.vitalSigns).blood_pressure, 'mmHg'],
                      ['Heart Rate', (selected.vital_signs || selected.vitalSigns).heart_rate, 'bpm'],
                      ['Temperature', (selected.vital_signs || selected.vitalSigns).temperature, 'C'],
                      ['Respiratory', (selected.vital_signs || selected.vitalSigns).respiratory, '/min'],
                      ['SpO2', (selected.vital_signs || selected.vitalSigns).oxygen, '%'],
                      ['Weight', (selected.vital_signs || selected.vitalSigns).weight, 'kg'],
                    ].map(([label, value, unit]) => (
                      <div key={label} className="rounded-lg bg-background px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase text-text-light">{label}</p>
                        <p className="font-bold text-text">{value || '-'} <span className="text-xs font-medium text-text-light">{value ? unit : ''}</span></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light">No vital signs recorded.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <FilePlus size={15} className="text-indigo-600" /> Uploaded Files
              </p>
              {(selected.medical_images || selected.medicalImages || []).length === 0 ? (
                <p className="text-sm text-text-light">No uploaded files for this request.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(selected.medical_images || selected.medicalImages || []).map((file) => (
                    <div key={file.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-bg text-indigo-600">
                        <FileText size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{fileName(file)}</p>
                        <p className="text-xs text-text-light">{file.document_type || file.file_type?.toUpperCase() || 'Medical File'} · {file.notes || 'No notes'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadMedicalFile(file)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-bg px-3 py-2 text-xs font-bold text-primary-text hover:bg-primary-hover transition-colors"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
              <button type="button" onClick={() => handleReschedule(selected)} className="px-5 py-2.5 text-primary-text bg-primary-bg font-semibold hover:bg-primary-hover rounded-xl transition-colors flex items-center justify-center gap-2">
                <Calendar size={16} /> Reschedule
              </button>
              <button type="button" onClick={() => handleAccept(selected)} className="px-5 py-2.5 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-200">
                <CheckCircle size={16} /> Accept Request
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Doctor Availability Settings Modal */}
      <Modal isOpen={availabilityModal} onClose={() => setAvailabilityModal(false)} title="Availability Settings">
        <form data-tour="page-form" onSubmit={handleAvailabilitySubmit} className="space-y-4">
          <div className="rounded-xl border border-sky-100 bg-primary-bg px-4 py-3 text-sm text-primary-text">
            Select your doctor type and set available days and time slots. Conflicts keep your previous schedule unchanged.
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Doctor Type</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-hover/50 p-1">
              {['Resident', 'Visiting'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAvailabilityForm((form) => ({ ...form, doctor_type: type }))}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    availabilityForm.doctor_type === type
                      ? 'bg-surface text-primary-text shadow-sm'
                      : 'text-text-muted hover:text-text-muted'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {availabilityForm.doctor_type === 'Visiting' && (
              <p className="mt-2 text-xs text-amber-600">
                Visiting doctors are limited to 3 days per week and 4 hours per time slot.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text-muted">Schedule Entries</p>
              <button
                type="button"
                onClick={addAvailabilitySlot}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-bg px-3 py-1.5 text-xs font-bold text-primary-text hover:bg-primary-hover transition-colors"
              >
                <Plus size={13} /> Add Slot
              </button>
            </div>

            {availabilityForm.availability.map((slot, index) => (
              <div key={`${slot.day_of_week}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2 rounded-xl border border-border bg-background p-3">
                <select
                  required
                  value={slot.day_of_week}
                  onChange={(e) => updateAvailabilitySlot(index, 'day_of_week', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <input
                  required
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateAvailabilitySlot(index, 'start_time', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  required
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateAvailabilitySlot(index, 'end_time', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeAvailabilitySlot(index)}
                  disabled={availabilityForm.availability.length === 1}
                  className="inline-flex items-center justify-center rounded-lg bg-surface px-3 py-2 text-rose-500 border border-border hover:bg-danger-bg disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Remove slot"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setAvailabilityModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-semibold hover:bg-sky-600 rounded-xl flex items-center gap-2 shadow-md shadow-sky-200">
              <Save size={16} /> Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Request Modal */}
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Teleconsultation">
        <form data-tour="page-form" onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="rounded-xl border border-sky-100 bg-primary-bg px-4 py-3 text-sm text-primary-text">
            Enter your consultation details, vital signs, and preferred schedule. The system will schedule an available doctor or queue the request for coordination.
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Needed Specialization</label>
            <select
              required
              value={requestForm.requested_specialization}
              onChange={e => setRequestForm({ ...requestForm, requested_specialization: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              {specializations.length === 0 && <option value="General Medicine">General Medicine</option>}
              {specializations.map((specialization) => (
                <option key={specialization} value={specialization}>{specialization}</option>
              ))}
            </select>
          </div>
          {requestForm.doctor_id && (
            <div className="bg-primary-bg border border-sky-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-sky-800">Selected Doctor: </span>
                <span className="text-primary-text">Dr. {matchingAvailableDoctors.find(d => d.id === requestForm.doctor_id)?.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setRequestForm({ ...requestForm, doctor_id: null, scheduled_at: '' })}
                className="text-xs font-bold text-danger-text hover:text-rose-700"
              >
                Clear Selection
              </button>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Consultation Details</label>
            <textarea
              required
              rows={3}
              value={requestForm.symptoms}
              onChange={e => setRequestForm({ ...requestForm, symptoms: e.target.value })}
              placeholder="Describe your symptoms or reason for consultation"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={requestForm.notes}
              onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
              placeholder="Medication, allergies, or other concerns"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-text-muted mb-2">Vital Signs</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={requestForm.vitals.blood_pressure} onChange={e => updateRequestVital('blood_pressure', e.target.value)} placeholder="Blood pressure, e.g. 120/80" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              <input type="text" value={requestForm.vitals.heart_rate} onChange={e => updateRequestVital('heart_rate', e.target.value)} placeholder="Heart rate, e.g. 72 bpm" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              <input type="text" value={requestForm.vitals.temperature} onChange={e => updateRequestVital('temperature', e.target.value)} placeholder="Temperature, e.g. 36.6 C" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              <input type="text" value={requestForm.vitals.respiratory} onChange={e => updateRequestVital('respiratory', e.target.value)} placeholder="Respiratory rate, e.g. 16/min" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              <input type="text" value={requestForm.vitals.oxygen} onChange={e => updateRequestVital('oxygen', e.target.value)} placeholder="Oxygen saturation, e.g. 98%" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              <input type="text" value={requestForm.vitals.weight} onChange={e => updateRequestVital('weight', e.target.value)} placeholder="Weight, e.g. 65 kg" className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase text-text-light mb-2">Doctor Availability</p>
            <div className="space-y-2">
              {matchingAvailableDoctors.length === 0 ? (
                <p className="text-sm text-text-light">No active doctors listed for this specialization.</p>
              ) : matchingAvailableDoctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">Dr. {(doctor.name || '').replace(/^Dr\.\s*/i, '')}</p>
                    <p className="text-xs text-text-light">{doctor.specialization}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-text-muted">
                      {availabilityLabel(doctor.availability)}
                    </p>
                  </div>
                  <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${doctor.is_available_now ? 'bg-emerald-100 text-success-text' : 'bg-amber-100 text-warning-text'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${doctor.is_available_now ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {doctor.is_available_now ? 'Available now' : 'Off schedule'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Preferred Date &amp; Time</label>
            <input
              required
              type="datetime-local"
              value={requestForm.scheduled_at}
              onChange={e => setRequestForm({ ...requestForm, scheduled_at: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text">Available Appointment Slots</p>
                <p className="text-xs text-text-light">Week of {requestWeekStart.toLocaleDateString()}</p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-text">
                Open slots can be selected
              </span>
            </div>

            {matchingAvailableDoctors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-light">
                Select a specialization with active doctors to see appointment slots.
              </div>
            ) : (
      <div data-tour="page-list" className="space-y-4">
                {matchingAvailableDoctors.map((doctor) => (
                  <div key={`request-slots-${doctor.id}`} className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-text">Dr. {(doctor.name || '').replace(/^Dr\.\s*/i, '')}</p>
                        <p className="text-xs text-text-light">{doctor.doctor_type || 'Resident'} · {doctor.specialization} · {doctor.slot_capacity || 18} slots per block</p>
                      </div>
                      <p className="text-xs font-medium text-text-muted">{availabilityLabel(doctor.availability)}</p>
                    </div>
                    {doctor.availability?.length ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                        {requestWeekDays.map((date) => {
                          const slots = doctor.availability
                            .filter((slot) => slot.day_of_week === dayName(date))
                            .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
                          const isSelectedDate = requestSelectedDateKey === date.toDateString();

                          return (
                            <div
                              key={`${doctor.id}-${date.toISOString()}`}
                              className={`min-h-28 rounded-lg border p-2 ${
                                isSelectedDate ? 'border-sky-300 bg-primary-bg' : 'border-border bg-surface'
                              }`}
                            >
                              <p className={`mb-2 text-xs font-bold ${isSelectedDate ? 'text-primary-text' : 'text-text-muted'}`}>
                                {shortDayLabel(date)}
                              </p>
                              {slots.length === 0 ? (
                                <p className="rounded-md bg-background px-2 py-2 text-center text-[11px] font-medium text-text-light">
                                  No slots
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {slots.map((slot) => {
                                    const slotStart = String(slot.start_time).slice(0, 5);
                                    const slotStatus = doctorSlotStatus(doctor, date, slot);
                                    const isFull = slotStatus.isFull;
                                    const isSelectedSlot = isSelectedDate && requestSelectedTime === slotStart;

                                    return (
                                      <button
                                        key={`${doctor.id}-${dateKey(date)}-${slot.start_time}-${slot.end_time}`}
                                        type="button"
                                        disabled={isFull}
                                        onClick={() => setRequestForm((form) => ({ ...form, scheduled_at: dateTimeLocalValue(date, slotStart), doctor_id: doctor.id }))}
                                        className={`w-full rounded-md px-2 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
                                          isFull
                                            ? 'bg-danger-bg text-rose-400 line-through'
                                            : isSelectedSlot
                                              ? 'bg-sky-600 text-white shadow-sm'
                                              : 'bg-success-bg text-success-text hover:bg-emerald-100'
                                        }`}
                                      >
                                        {timeRangeLabel(slot)} · {isFull ? 'Full' : `${slotStatus.remaining} left`}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text">
                        This doctor has no fixed weekly schedule, so the preferred date and time can be typed manually.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setRequestModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-semibold hover:bg-sky-600 rounded-xl flex items-center gap-2 shadow-md shadow-sky-200">
              <Stethoscope size={16} /> Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Reschedule Consultation">
        {selected && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-brand-bg text-indigo-600 flex items-center justify-center font-bold">
                {(selected.patient?.user?.name || 'P').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text text-sm">{selected.patient?.user?.name || 'Patient'}</p>
                <p className="text-xs text-text-light">
                  Current schedule: {selected.scheduled_at ? new Date(selected.scheduled_at).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
            {(user?.role === 'Admin' || user?.role === 'Staff') && (
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Assigned Doctor</label>
                <select required value={rescheduleForm.doctor_id} onChange={e => setRescheduleForm({ ...rescheduleForm, doctor_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none">
                  <option value="">Select a doctor...</option>
                  {doctors.map(d => <option key={d.doctor?.id} value={d.doctor?.id}>Dr. {(d.name || '').replace(/^Dr\.\s*/i, '')}</option>)}
                </select>
              </div>
            )}
            {user?.role === 'Patient' && (
              <div className="rounded-xl border border-sky-100 bg-primary-bg px-4 py-3 text-sm text-primary-text">
                {rescheduleDoctorName
                  ? `Choose from Dr. ${(rescheduleDoctorName || '').replace(/^Dr\.\s*/i, '')}'s weekly available slots below.`
                  : 'Choose from your assigned doctor\'s weekly available slots below.'}
              </div>
            )}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Doctor Weekly Availability</p>
                  <p className="text-xs text-text-light">
                    Week of {rescheduleWeekStart.toLocaleDateString()} {rescheduleDoctorName ? `for Dr. ${(rescheduleDoctorName || '').replace(/^Dr\.\s*/i, '')}` : ''}
                  </p>
                </div>
                {rescheduleDoctor?.doctor_type && (
                  <span className="inline-flex w-fit items-center rounded-full bg-primary-bg px-3 py-1 text-xs font-bold text-primary-text">
                    {rescheduleDoctor.doctor_type}
                  </span>
                )}
              </div>

              {!rescheduleDoctor ? (
                <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-light">
                  Select a doctor to see available days and time slots.
                </div>
              ) : rescheduleAvailability.length === 0 ? (
                <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-text">
                  This doctor has no fixed weekly schedule, so any valid date and time can be selected.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                  {rescheduleWeekSchedule.map(({ date, slots }) => {
                    const isSelectedDate = selectedDateKey === date.toDateString();
                    return (
                      <div
                        key={date.toISOString()}
                        className={`min-h-28 rounded-lg border p-2 transition-colors ${
                          isSelectedDate ? 'border-sky-300 bg-primary-bg' : 'border-border bg-background'
                        }`}
                      >
                        <p className={`mb-2 text-xs font-bold ${isSelectedDate ? 'text-primary-text' : 'text-text-muted'}`}>
                          {shortDayLabel(date)}
                        </p>
                        {slots.length === 0 ? (
                          <p className="rounded-md bg-surface px-2 py-2 text-center text-[11px] font-medium text-text-light">
                            No slots
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {slots.map((slot) => {
                              const slotStart = String(slot.start_time).slice(0, 5);
                              const slotStatus = doctorSlotStatus(rescheduleDoctor, date, slot);
                              const isFull = slotStatus.isFull;
                              const isSelectedSlot = isSelectedDate && selectedTime === slotStart;
                              return (
                                <button
                                  key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
                                  type="button"
                                  disabled={isFull}
                                  onClick={() => setRescheduleForm((form) => ({ ...form, scheduled_at: dateTimeLocalValue(date, slotStart) }))}
                                  className={`w-full rounded-md px-2 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
                                    isFull
                                      ? 'bg-danger-bg text-rose-400 line-through'
                                      : isSelectedSlot
                                      ? 'bg-sky-600 text-white shadow-sm'
                                      : 'bg-surface text-text-muted hover:bg-primary-hover hover:text-primary-text'
                                  }`}
                                >
                                  {timeRangeLabel(slot)} · {isFull ? 'Full' : `${slotStatus.remaining} left`}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">New Date &amp; Time</label>
              <input required type="datetime-local" value={rescheduleForm.scheduled_at}
                onChange={e => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setRescheduleModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-sky-500 text-white font-semibold hover:bg-sky-600 rounded-xl flex items-center gap-2 shadow-md shadow-sky-200">
                <Calendar size={16} /> Save Schedule
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

