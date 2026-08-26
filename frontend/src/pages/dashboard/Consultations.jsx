import { useState, useEffect, useRef } from 'react';
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${m} ${ampm}`;
}

function formatScheduleSummary(availability) {
  if (!availability?.length) return 'Available without fixed schedule';
  const groups = {};
  availability.forEach(slot => {
    let t = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
    if (!groups[t]) groups[t] = [];
    groups[t].push(slot.day_of_week.substring(0, 3));
  });

  const parts = Object.entries(groups).map(([time, days]) => {
    let dayStr = days.join(', ');
    if (days.length === 7) dayStr = 'Everyday';
    else if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) dayStr = 'Weekdays';
    else if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) dayStr = 'Weekends';

    const [start, end] = time.split(' - ');
    return `${dayStr} ${formatTime12h(start)} - ${formatTime12h(end)}`;
  });
  return parts.join(' | ');
}


import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';
import ConsultationCalendar from '../../components/ConsultationCalendar';
import {
  Video, Calendar, Clock, CheckCircle, XCircle,
  Stethoscope, FilePlus, AlertCircle, Plus, Settings, Save, Trash2, Download, FileText, HeartPulse, Search, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutList
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  Pending:   { pill: 'bg-amber-50 text-amber-700 border-amber-200 border shadow-sm',   dot: 'bg-amber-500',   icon: Clock },
  Scheduled: { pill: 'bg-sky-50 text-sky-700 border-sky-200 border shadow-sm',       dot: 'bg-sky-500',     icon: Calendar },
  Completed: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 border shadow-sm', dot: 'bg-emerald-500', icon: CheckCircle },
  Cancelled: { pill: 'bg-slate-50 text-text-muted border-slate-200 border shadow-sm',   dot: 'bg-slate-400',   icon: XCircle },
  Missed:    { pill: 'bg-rose-50 text-rose-700 border-rose-200 border shadow-sm',       dot: 'bg-rose-500',    icon: AlertCircle },
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

const getDisplayStatus = (c) => {
  if (c.status === 'Scheduled' && c.scheduled_at) {
    const scheduledTime = new Date(c.scheduled_at).getTime();
    const now = new Date().getTime();
    if (now > scheduledTime + 15 * 60 * 1000) return 'Missed';
  }
  return c.status;
};

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.Scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

const FILTER_STYLES = {
  All: {
    active: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-indigo-100',
    labelActive: 'text-indigo-100',
  },
  Pending: {
    active: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-amber-100',
    labelActive: 'text-amber-100',
  },
  Scheduled: {
    active: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-sky-100',
    labelActive: 'text-sky-100',
  },
  Completed: {
    active: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent',
    iconActive: 'bg-white/20 text-white',
    textActive: 'text-white',
    subActive: 'text-emerald-100',
    labelActive: 'text-emerald-100',
  },
  Cancelled: {
    active: 'bg-gradient-to-br from-slate-500 to-gray-600 text-white border-transparent',
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


function calcAge(dob) {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
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


function getDoctorSlotsForDate(doctor, date) {
  if (!doctor) return [];
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const day = dayName(date);

  const exceptions = (doctor.exceptions || []).filter(e => e.date === dateStr);
  const leaves = exceptions.filter(e => e.type === 'leave');
  const extraSlots = exceptions.filter(e => e.type === 'extra_slot');

  const avail = (doctor.availability || []).filter(slot => slot.day_of_week === day);

  // If doctor has whole-day leave on this date, return no slots
  if (leaves.some(l => !l.start_time)) {
    return [];
  }

  const activeBlocks = [...avail, ...extraSlots];
  if (activeBlocks.length === 0) return [];

  const slots = [];
  for (let i = 0; i < 24; i++) {
    const start = String(i).padStart(2, '0') + ':00';
    const end = String(i + 1).padStart(2, '0') + ':00';
    
    // Find if this hour is covered by the doctor's real availability
    const parentBlock = activeBlocks.find(a => start >= String(a.start_time).slice(0, 5) && start < String(a.end_time).slice(0, 5));
    if (!parentBlock) continue; // Only keep real available hours — no fake unavailable clutter!

    // Skip if blocked by specific timed leave
    if (leaves.some(l => l.start_time && start >= String(l.start_time).slice(0, 5) && start < String(l.end_time).slice(0, 5))) {
      continue;
    }

    slots.push({
      start_time: start,
      end_time: end === '24:00' ? '23:59' : end,
      isAvailable: true,
      parentBlock
    });
  }

  return slots;
}


function dayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function shortDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeRangeLabel(slot) {
  if (!slot) return '';
  return `${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}`;

}

function availabilityLabel(availability) {
  if (!availability || availability.length === 0) {
    return 'Available without fixed schedule';
  }

  return availability
    .filter(slot => slot != null)
    .map((slot) => `${String(slot.day_of_week || '').slice(0, 3)} ${timeRangeLabel(slot)}`)
    .join(', ');
}

function groupAndFormatAvailability(availability) {
  if (!availability || availability.length === 0) {
    return [{ day: 'Any Day', slots: ['Available without fixed schedule'] }];
  }
  
  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grouped = {};
  
  availability.filter(slot => slot != null).forEach(slot => {
    const day = slot.day_of_week || 'Unknown';
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(timeRangeLabel(slot));
  });
  
  return DAYS_ORDER.filter(d => grouped[d]).map(day => ({
    day,
    slots: grouped[day]
  }));
}

function dateKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}


function doctorSlotStatus(doctor, date, slot) {
  const checkStart = slot.parentBlock ? String(slot.parentBlock.start_time).slice(0, 5) : String(slot.start_time).slice(0, 5);
  const checkEnd = slot.parentBlock ? String(slot.parentBlock.end_time).slice(0, 5) : String(slot.end_time).slice(0, 5);
  const day = dayName(date);

  const booked = (doctor.booked_slots || []).find((booked) => (
    booked.date === dateKey(date)
    && booked.day_of_week === day
    && String(booked.start_time).slice(0, 5) === checkStart
    && String(booked.end_time).slice(0, 5) === checkEnd
  ));

  const capacity = booked?.capacity || doctor.slot_capacity || 10;
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
  const tabs = ['Scheduled', 'Completed', 'Cancelled'];
  const [tab, setTab] = useState('Scheduled');
  
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filtered = consultations.filter(c => {
    const matchTab = tab === 'All' || c.status === tab;
    if (!matchTab) return false;

    if (tab === 'Completed' || tab === 'Cancelled') {
      const d = new Date(c.scheduled_at || c.created_at);
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (!isCurrentMonth) return false;
    }

    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || c.doctor?.user?.name?.toLowerCase().includes(q)
      || c.requested_specialization?.toLowerCase().includes(q)
      || (c.status || '').toLowerCase().includes(q);
    return matchSearch;
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
            const count = consultations.filter(c => {
              if (c.status !== t) return false;
              if (t === 'Completed' || t === 'Cancelled') {
                const d = new Date(c.scheduled_at || c.created_at);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }
              return true;
            }).length;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'}`}
              ><Icon size={14} /> {t} ({count})</button>
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
          <div className="flex border border-border rounded-xl bg-surface p-1 shrink-0 ml-1">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-sky-600' : 'text-text-muted hover:text-text'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-background shadow-sm text-sky-600' : 'text-text-muted hover:text-text'}`}
              title="Calendar View"
            >
              <CalendarIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-text-muted dark:text-slate-400">
          {tab === 'Scheduled' ? (
            <>Showing <span className="font-bold text-text dark:text-white">{filtered.length}</span> active scheduled appointments</>
          ) : (
            <>Showing <span className="font-bold text-text dark:text-white">{filtered.length}</span> {tab.toLowerCase()} consultations <span className="font-semibold text-sky-600 dark:text-sky-400">for this month</span></>
          )}
        </p>
      )}

      {/* Content */}
      {viewMode === 'calendar' ? (
        <ConsultationCalendar consultations={filtered} onViewConsultation={() => {}} />
      ) : (
      <div className="space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse">
            <div className="h-5 bg-surface-hover rounded w-40 mb-3" /><div className="h-4 bg-surface-hover/50 rounded w-64" />
          </div>
        )) : filtered.length === 0 ? <EmptyState message={tab === 'All' ? 'No consultations yet.' : `No ${tab.toLowerCase()} consultations.`} />
        : filtered.map(c => {
          const cfg = STATUS[c.status] || STATUS.Scheduled;
          return (
            <div key={c.id} className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot} hidden sm:block`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-text">
                    {c.doctor?.user?.name ? `Dr. ${(c.doctor.user.name || '').replace(/^Dr\.\s*/i, '')}` : 'Doctor to be assigned'}
                  </p>
                  <StatusPill status={getDisplayStatus(c)} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-text-light">
                  {c.requested_specialization && <span className="flex items-center gap-1"><Stethoscope size={12} /> {c.requested_specialization}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} /> Requested: {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.scheduled_at && <span className="flex items-center gap-1"><Clock size={12} /> Scheduled: {new Date(c.scheduled_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0 mt-3 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
                {['Scheduled'].includes(c.status) && (
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
        )}
      </div>
    );
  }

// ─── DOCTOR VIEW ──────────────────────────────────────────────────────────────
function DoctorView({ consultations, loading, onAccept, onReview, onReschedule, onCancel, onCallEarly, availabilityStatus, onOpenAvailability }) {
  const [tab, setTab] = useState('Scheduled');
  const [search, setSearch] = useState('');

  const { user } = useAuthStore();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const cancelled = consultations.filter(c => {
    if (c.doctor_id !== user?.doctor?.id) return false;
    if (c.status !== 'Cancelled' && c.status !== 'Missed') return false;
    const d = new Date(c.scheduled_at || c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const scheduled = consultations.filter(c => c.status === 'Scheduled');

  const completed = consultations.filter(c => {
    if (c.doctor_id !== user?.doctor?.id) return false;
    if (c.status !== 'Completed') return false;
    const d = new Date(c.scheduled_at || c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const canCallEarly = (c) => {
    if (!c.scheduled_at) return false;
    const sched = new Date(c.scheduled_at);
    const now = new Date();
    const isToday = sched.getDate() === now.getDate() &&
                    sched.getMonth() === now.getMonth() &&
                    sched.getFullYear() === now.getFullYear();
    if (!isToday) return false;

    const hour = now.getHours();
    if (hour < 8 || hour >= 17) return false;

    const diffMs = sched.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins >= -15 && diffMins <= 60;
  };

  const baseFiltered = tab === 'Scheduled' ? scheduled : tab === 'Completed' ? completed : cancelled;

  const filtered = baseFiltered.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.patient?.user?.name || '').toLowerCase().includes(q) ||
      (c.form?.symptoms || '').toLowerCase().includes(q) ||
      (c.form?.diagnosis || '').toLowerCase().includes(q) ||
      `cn-${String(c.id).padStart(6, '0')}`.includes(q)
    );
  });

  if (tab === 'Scheduled') {
    const priorityGroup = [];
    const regularGroup = [];

    filtered.forEach(c => {
      const isPWD = Boolean(c.patient?.category?.includes('PWD'));
      const isSenior = Boolean(c.patient?.category?.includes('Senior') || (c.patient?.dob && calcAge(c.patient?.dob) >= 60));
      if (isPWD || isSenior) {
        priorityGroup.push(c);
      } else {
        regularGroup.push(c);
      }
    });

    const sortByDate = (a, b) => new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
    priorityGroup.sort(sortByDate);
    regularGroup.sort(sortByDate);

    const interleaved = [];
    let pIdx = 0;
    let rIdx = 0;
    while (pIdx < priorityGroup.length || rIdx < regularGroup.length) {
      if (pIdx < priorityGroup.length) interleaved.push(priorityGroup[pIdx++]);
      if (rIdx < regularGroup.length) interleaved.push(regularGroup[rIdx++]);
    }
    filtered.splice(0, filtered.length, ...interleaved);
  } else {
    filtered.sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at));
  }

  return (
    <div className="space-y-6">
      {/* Availability Bar */}
      {availabilityStatus ? (
        <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm ${availabilityStatus.is_available_now ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200'}`}>
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <span className={`h-3 w-3 rounded-full shrink-0 ${availabilityStatus.is_available_now ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{availabilityStatus.doctor_type || 'Resident'} Physician · {availabilityStatus.is_available_now ? 'Active & On Schedule Now' : 'Active (Outside Scheduled Hours)'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs font-semibold opacity-90">{availabilityStatus.scheduleLabel || 'No fixed schedule set'}</p>
            <button
              data-tour="page-primary-action"
              onClick={onOpenAvailability}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-extrabold text-slate-800 dark:text-white border border-border dark:border-slate-700 hover:bg-surface-hover transition-all shadow-sm shrink-0"
            >
              <Settings size={14} /> Schedule Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div>
            <p className="font-bold text-text dark:text-white">Doctor Weekly Availability</p>
            <p className="text-xs text-text-light dark:text-slate-400 mt-0.5">Configure your consultation working hours and exception dates.</p>
          </div>
          <button
            data-tour="page-primary-action"
            onClick={onOpenAvailability}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-colors shadow-sm"
          >
            <Settings size={15} /> Configure Hours
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Scheduled Queue', status: 'Scheduled', count: scheduled.length, sub: 'Upcoming patients' },
          { label: 'Completed', status: 'Completed', count: completed.length, sub: 'Finished this month' },
          { label: 'Cancelled / Missed', status: 'Cancelled', count: cancelled.length, sub: 'Cancelled / Missed this month' },
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

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          {['Scheduled', 'Completed', 'Cancelled'].map(t => {
            const Icon = TAB_ICON[t] || Stethoscope;
            const count = t === 'Scheduled' ? scheduled.length : t === 'Completed' ? completed.length : cancelled.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  tab === t 
                    ? 'bg-sky-600 text-white shadow-sm' 
                    : 'bg-surface dark:bg-slate-900/60 text-text-muted dark:text-slate-400 border border-border dark:border-slate-800 hover:border-sky-300 hover:text-text dark:hover:text-white'
                }`}
              >
                <Icon size={15} /> {t} <span className="ml-1 opacity-80">({count})</span>
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
              placeholder="Search patient or symptoms..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-rose-600 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-text-muted dark:text-slate-400">
          {tab === 'Scheduled' ? (
            <>Showing <span className="font-bold text-text dark:text-white">{filtered.length}</span> active scheduled appointments</>
          ) : (
            <>Showing <span className="font-bold text-text dark:text-white">{filtered.length}</span> {tab.toLowerCase()} consultations <span className="font-semibold text-sky-600 dark:text-sky-400">for this month</span></>
          )}
        </p>
      )}

      {/* Patient Queue List */}
      <div data-tour="page-list" className="bg-surface dark:bg-slate-900/60 rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle size={36} className="mx-auto text-emerald-400 opacity-80" />
            <p className="font-bold text-text dark:text-white">No {tab.toLowerCase()} consultations in your queue.</p>
            <p className="text-xs text-text-light dark:text-slate-400">New patient bookings will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 dark:divide-slate-800">
            {filtered.map((c, i) => {
              const isPWD = Boolean(c.patient?.category?.includes('PWD'));
              const isSenior = Boolean(c.patient?.category?.includes('Senior') || (c.patient?.dob && calcAge(c.patient?.dob) >= 60));
              const isCalledEarly = Boolean(c.notes?.includes('[EARLY_CALL]'));

              return (
                <div key={c.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-background/40 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Queue number */}
                    <div className="w-10 h-10 rounded-2xl bg-surface-hover/60 dark:bg-slate-800 text-text-muted dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0 border border-border/70 dark:border-slate-700 shadow-sm">
                      #{i + 1}
                    </div>

                    {/* Patient Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-base shrink-0 border border-sky-200 dark:border-sky-800/50 shadow-sm">
                      {(c.patient?.user?.name || 'P').charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm sm:text-base text-text dark:text-white truncate">
                          {c.patient?.user?.name || 'Unknown Patient'}
                        </p>
                        {isPWD && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            ♿ PWD
                          </span>
                        )}
                        {isSenior && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            👴 Senior
                          </span>
                        )}
                        {isCalledEarly && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            🔔 Called Early
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-light dark:text-slate-400">
                        {c.scheduled_at && (
                          <span className="flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400">
                            <Clock size={13} /> {new Date(c.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Stethoscope size={13} /> {c.requested_specialization || 'General Medicine'}
                        </span>
                      </div>

                      {c.form?.symptoms && (
                        <p className="text-xs text-text-muted dark:text-slate-300 line-clamp-1 italic">
                          "{c.form.symptoms}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {c.status === 'Scheduled' && (
                      <>
                        <Link
                          to={`/teleconsultation/${c.id}`}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Video size={15} /> Enter Room
                        </Link>
                        {!isCalledEarly && (
                          <button
                            type="button"
                            disabled={!canCallEarly(c)}
                            onClick={() => onCallEarly && onCallEarly(c)}
                            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all ${
                              canCallEarly(c)
                                ? 'border-sky-300 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer'
                                : 'border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text-muted dark:text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                            title={
                              canCallEarly(c)
                                ? "Notify this patient via email & push alert that you are ready ahead of schedule"
                                : "Only available on the day of appointment, starting 1 hour before scheduled time (8:00 AM - 5:00 PM)"
                            }
                          >
                            🔔 Call In Early
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onReschedule(c)}
                          className="px-3 py-2 rounded-xl border border-border dark:border-slate-700 bg-surface dark:bg-slate-800 text-text-muted dark:text-slate-300 hover:text-text font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Calendar size={14} /> Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancel(c)}
                          className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      </>
                    )}
                    {c.status === 'Completed' && (
                      <Link
                        to="/prescriptions"
                        className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
                      >
                        <FilePlus size={15} /> View Prescription
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN / STAFF VIEW ───────────────────────────────────────────────────────
function AdminView({ consultations, loading, onReschedule, onCancel }) {
  const [tab, setTab] = useState('Scheduled');
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filtered = consultations.filter(c => {
    const matchTab = c.status === tab;
    if (!matchTab) return false;

    if (tab === 'Completed' || tab === 'Cancelled') {
      const d = new Date(c.scheduled_at || c.created_at);
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (!isCurrentMonth) return false;
    }

    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      c.patient?.user?.name?.toLowerCase().includes(q) ||
      c.doctor?.user?.name?.toLowerCase().includes(q) ||
      `cn-${String(c.id).padStart(6, '0')}`.includes(q);
    return matchSearch;
  });

  if (tab === 'Scheduled') {
    const priorityGroup = [];
    const regularGroup = [];

    filtered.forEach(c => {
      const isPWD = Boolean(c.patient?.category?.includes('PWD'));
      const isSenior = Boolean(c.patient?.category?.includes('Senior') || (c.patient?.dob && calcAge(c.patient?.dob) >= 60));
      if (isPWD || isSenior) {
        priorityGroup.push(c);
      } else {
        regularGroup.push(c);
      }
    });

    const sortByDate = (a, b) => new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at);
    priorityGroup.sort(sortByDate);
    regularGroup.sort(sortByDate);

    const interleaved = [];
    let pIdx = 0;
    let rIdx = 0;
    while (pIdx < priorityGroup.length || rIdx < regularGroup.length) {
      if (pIdx < priorityGroup.length) interleaved.push(priorityGroup[pIdx++]);
      if (rIdx < regularGroup.length) interleaved.push(regularGroup[rIdx++]);
    }
    filtered.splice(0, filtered.length, ...interleaved);
  } else {
    filtered.sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at));
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div data-tour="page-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { status: 'Scheduled', sub: 'Upcoming sessions' },
          { status: 'Completed', sub: 'Completed this month' },
          { status: 'Cancelled', sub: 'Cancelled this month' }
        ].map(s => {
          const count = consultations.filter(c => {
            if (c.status !== s.status) return false;
            if (s.status === 'Completed' || s.status === 'Cancelled') {
              const d = new Date(c.scheduled_at || c.created_at);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }
            return true;
          }).length;
          return (
            <InteractiveStatCard
              key={s.status}
              status={s.status}
              label={s.status}
              count={count}
              sub={s.sub}
            />
          );
        })}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Scheduled','Completed','Cancelled'].map(t => {
            const Icon = TAB_ICON[t] || Stethoscope;
            const count = consultations.filter(c => {
              if (c.status !== t) return false;
              if (t === 'Completed' || t === 'Cancelled') {
                const d = new Date(c.scheduled_at || c.created_at);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }
              return true;
            }).length;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-sky-600 text-white shadow-sm' : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'}`}
              ><Icon size={14} /> {t} ({count})</button>
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
          {tab === 'Scheduled' ? (
            <>Showing <span className="font-semibold text-text">{filtered.length}</span> active scheduled appointments</>
          ) : (
            <>Showing <span className="font-semibold text-text">{filtered.length}</span> {tab.toLowerCase()} consultations <span className="font-semibold text-sky-600">for this month</span></>
          )}
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
                    <td className="px-5 py-3"><StatusPill status={getDisplayStatus(c)} /></td>
                    <td className="px-5 py-3 text-right">
                      {c.status === 'DELETED_STATUS' && (
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading]     = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [medicalImages, setMedicalImages] = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ doctor_id: '', scheduled_at: '' });
  const [specializations, setSpecializations] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [requestDoctorIndex, setRequestDoctorIndex] = useState(0);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
  const [requestWeekOffset, setRequestWeekOffset] = useState(0);
  const [rescheduleWeekOffset, setRescheduleWeekOffset] = useState(0);
  const [typhoonMode, setTyphoonMode] = useState('none');
  useEffect(() => {
    if (!user) return;
    api.get('/system/typhoon-mode')
      .then(res => setTyphoonMode(res.data.typhoon_mode || 'none'))
      .catch(() => {});
  }, [user]);
  const [availabilityForm, setAvailabilityForm] = useState({
    doctor_type: 'Resident',
    availability: [{ ...EMPTY_AVAILABILITY_SLOT, _id: crypto.randomUUID() }],
  });

  
  const [isUploadingMini, setIsUploadingMini] = useState(false);
  // Request notification permissions for device alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Trigger Device / Browser Notification when early call is received
  const notifiedIdsRef = useRef(new Set());
  useEffect(() => {
    if (user?.role === 'Patient' && consultations.length > 0) {
      consultations.forEach(c => {
        if (c.status === 'Scheduled' && c.notes?.includes('[EARLY_CALL]') && !notifiedIdsRef.current.has(c.id)) {
          notifiedIdsRef.current.add(c.id);
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification('🔔 Doctor is Ready Early!', {
              body: `Dr. ${(c.doctor?.user?.name || 'Your doctor').replace(/^Dr\.\s*/i, '')} is ready for you now. Tap to join room.`,
              icon: '/CHO1-Logo.png',
              tag: `early-call-${c.id}`,
            });
            n.onclick = () => {
              window.focus();
              navigate(`/teleconsultation/${c.id}`);
            };
          }
        }
      });
    }
  }, [consultations, user, navigate]);
  const [quickDocType, setQuickDocType] = useState('PWD ID Card');

  const handleMiniUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate size (e.g. 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploadingMini(true);
      const fd = new FormData();
      fd.append('image', file);
      fd.append('document_type', quickDocType || 'Other');
      fd.append('notes', 'Attached during consultation request');

      const response = await api.post('/medical-images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('File uploaded successfully!');
      
      // Refresh the medicalImages state
      const res = await api.get('/medical-images');
      setMedicalImages(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploadingMini(false);
      e.target.value = ''; // Reset input
    }
  };

const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations?show_all=1');
      setConsultations(res.data);
    } catch { toast.error('Failed to load consultations'); }
    finally   { setLoading(false); }
  };

  useEffect(() => {
    let isActive = true;
    api.get('/consultations?show_all=1')
      .then(res => {
        if (isActive) setConsultations(res.data);
      })
      .catch(() => { if (isActive) toast.error('Failed to load consultations'); })
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
        api.get('/medical-images')
          .then(res => { if (isActive) setMedicalImages(res.data); })
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

  useEffect(() => {
    setRequestDoctorIndex(0);
  }, [requestForm.requested_specialization]);

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

  const handleCallEarly = async (c) => {
    try {
      const res = await api.post(`/consultations/${c.id}/call-early`);
      toast.success(res.data?.message || 'Patient notified to join early!');
      fetchConsultations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to notify patient');
    }
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
            end_time: String(slot.end_time || '12:00').slice(0, 5), _id: crypto.randomUUID(),
          }))
        : [{ ...EMPTY_AVAILABILITY_SLOT }],
      exceptions: current?.exceptions?.length 
        ? current.exceptions.map((exc) => ({
            date: exc.date.split('T')[0],
            type: exc.type,
            start_time: exc.start_time ? String(exc.start_time).slice(0, 5) : '',
            end_time: exc.end_time ? String(exc.end_time).slice(0, 5) : '',
            _id: crypto.randomUUID(),
        })) : [],
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
      availability: [...form.availability, { ...EMPTY_AVAILABILITY_SLOT, _id: crypto.randomUUID() }],
    }));
  };

  const removeAvailabilitySlot = (index) => {
    setAvailabilityForm((form) => ({
      ...form,
      availability: form.availability.filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const updateExceptionSlot = (index, key, value) => {
    setAvailabilityForm((form) => ({
      ...form,
      exceptions: form.exceptions.map((exc, excIndex) => (
        excIndex === index ? { ...exc, [key]: value } : exc
      )),
    }));
  };

  const addExceptionSlot = () => {
    setAvailabilityForm((form) => ({
      ...form,
      exceptions: [...(form.exceptions || []), { date: new Date().toISOString().split('T')[0], type: 'leave', start_time: '', end_time: '', _id: crypto.randomUUID() }],
    }));
  };

  const removeExceptionSlot = (index) => {
    setAvailabilityForm((form) => ({
      ...form,
      exceptions: (form.exceptions || []).filter((_, excIndex) => excIndex !== index),
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
    scheduleLabel: formatScheduleSummary(currentDoctorStatus.availability),
  } : null;
  const matchingAvailableDoctors = availableDoctors.filter((doctor) => doctor.specialization === requestForm.requested_specialization);
  const requestWeekStart = addDays(startOfWeek(new Date()), requestWeekOffset * 7);
  const requestWeekDays = Array.from({ length: 7 }, (_, index) => addDays(requestWeekStart, index));
  const requestSelectedDate = requestForm.scheduled_at ? new Date(requestForm.scheduled_at) : null;
  const requestSelectedDateKey = requestSelectedDate && !Number.isNaN(requestSelectedDate.getTime()) ? requestSelectedDate.toDateString() : '';
  const requestSelectedTime = requestForm.scheduled_at ? requestForm.scheduled_at.slice(11, 16) : '';
  const rescheduleDoctorId = rescheduleForm.doctor_id || selected?.doctor_id || selected?.doctor?.id;
  const rescheduleDoctor = availableDoctors.find((doctor) => String(doctor.id) === String(rescheduleDoctorId));
  const rescheduleWeekStart = addDays(startOfWeek(new Date()), rescheduleWeekOffset * 7);
  const rescheduleWeekDays = Array.from({ length: 7 }, (_, index) => addDays(rescheduleWeekStart, index));
  const selectedDateTime = rescheduleForm.scheduled_at ? new Date(rescheduleForm.scheduled_at) : null;
  const selectedDateKey = selectedDateTime && !Number.isNaN(selectedDateTime.getTime()) ? selectedDateTime.toDateString() : '';
  const selectedTime = rescheduleForm.scheduled_at ? rescheduleForm.scheduled_at.slice(11, 16) : '';
  const rescheduleAvailability = rescheduleDoctor?.availability || [];
  const rescheduleDoctorName = rescheduleDoctor?.name || selected?.doctor?.user?.name;
  const rescheduleWeekSchedule = rescheduleWeekDays.map((date) => ({
    date,
    slots: getDoctorSlotsForDate(rescheduleDoctor, date)
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">      <header>
        <PageTitle icon={Stethoscope} title={title.h1} description={title.sub} iconClassName="bg-primary-bg text-primary-text" />
      </header>

      {user?.role === 'Patient' && <PatientView consultations={consultations} loading={loading} onRequest={handleRequest} onReschedule={handleReschedule} onCancel={handleCancel} />}
      {user?.role === 'Doctor'  && <DoctorView consultations={consultations} loading={loading} onAccept={handleAccept} onReview={handleReview} onReschedule={handleReschedule} onCancel={handleCancel} onCallEarly={handleCallEarly} availabilityStatus={currentDoctorAvailability} onOpenAvailability={openAvailabilitySettings} />}
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
                <StatusPill status={getDisplayStatus(selected)} />
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

              {user?.role !== 'Patient' && (
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
              )}
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
              <div key={slot._id || index} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2 rounded-xl border border-border bg-background p-3">
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

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-muted">Emergency Leaves & Ad-Hoc Slots</p>
                <p className="text-xs text-text-light">Block specific dates or open extra time</p>
              </div>
              <button
                type="button"
                onClick={addExceptionSlot}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-bg px-3 py-1.5 text-xs font-bold text-primary-text hover:bg-primary-hover transition-colors"
              >
                <Plus size={13} /> Add Exception
              </button>
            </div>

            {(availabilityForm.exceptions || []).map((exc, index) => (
              <div key={exc._id || index} className="grid grid-cols-1 sm:grid-cols-[1fr_110px_100px_100px_auto] gap-2 rounded-xl border border-rose-200/50 bg-rose-50/30 p-3">
                <input
                  required
                  type="date"
                  value={exc.date}
                  onChange={(e) => updateExceptionSlot(index, 'date', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <select
                  required
                  value={exc.type}
                  onChange={(e) => updateExceptionSlot(index, 'type', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="leave">Leave (Block)</option>
                  <option value="extra_slot">Extra Slot</option>
                </select>
                <input
                  type="time"
                  value={exc.start_time || ''}
                  onChange={(e) => updateExceptionSlot(index, 'start_time', e.target.value)}
                  placeholder="Start"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="time"
                  value={exc.end_time || ''}
                  onChange={(e) => updateExceptionSlot(index, 'end_time', e.target.value)}
                  placeholder="End"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeExceptionSlot(index)}
                  className="inline-flex items-center justify-center rounded-lg bg-surface px-3 py-2 text-rose-500 border border-border hover:bg-danger-bg transition-colors"
                  title="Remove exception"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {(availabilityForm.exceptions || []).length === 0 && (
              <p className="text-xs text-text-light italic text-center py-2">No exceptions added.</p>
            )}
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
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Teleconsultation" maxWidth="max-w-6xl">
        <form data-tour="page-form" onSubmit={handleRequestSubmit}>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
<div className="lg:col-span-4 space-y-4">

          {typhoonMode !== 'none' ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-semibold animate-pulse flex items-start gap-2 shadow-sm">
              <span className="text-sm leading-none mt-0.5">🌀</span>
              <div>
                <b>Typhoon Staffing Mode Active ({typhoonMode === 'team_a' ? 'Team A & C' : 'Team B & C'} On-Duty)</b><br />
                Some doctors or specializations may be off-duty. Only active emergency response staff (active team + core Team C standby) can take appointments.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-sky-100 bg-primary-bg px-4 py-3 text-sm text-primary-text">
              Enter your consultation details and select your preferred schedule.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Available Doctor Specialization</label>
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
            <label className="block text-sm font-medium text-text-muted mb-1">Consultation Request For</label>
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

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted dark:text-slate-400">
                Attached Files & Verification IDs
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={quickDocType}
                  onChange={(e) => setQuickDocType(e.target.value)}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text dark:text-slate-200 outline-none"
                >
                  <option value="PWD ID Card">🆔 PWD ID Card</option>
                  <option value="Senior Citizen ID">👴 Senior Citizen ID</option>
                  <option value="Disability Certificate">📄 Disability Certificate</option>
                  <option value="Lab Test Results">🩺 Lab Results</option>
                  <option value="Prescription Photo">💊 Prescription Rx</option>
                  <option value="Other">📁 Other Document</option>
                </select>
                <input type="file" id="mini-upload" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx" onChange={handleMiniUpload} disabled={isUploadingMini} />
                <label htmlFor="mini-upload" className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer transition-colors shadow-sm ${isUploadingMini ? 'opacity-50 cursor-wait' : ''}`}>
                  <FilePlus size={13} />
                  {isUploadingMini ? 'Attaching...' : 'Attach'}
                </label>
              </div>
            </div>

            {/* In-modal PWD / Senior ID reminder */}
            {(user?.patient?.category?.includes('PWD') || user?.patient?.category === 'Senior Citizen') && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-sm shrink-0">♿</span>
                <p className="leading-tight">
                  <b>Priority Verification:</b> Don't forget to attach your <b>PWD or Senior ID</b> so your doctor can verify your priority lane status.
                </p>
              </div>
            )}

            {medicalImages.length > 0 ? (
              <div className="rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900/60 overflow-hidden shadow-sm">
                <div className="max-h-32 overflow-y-auto divide-y divide-border dark:divide-slate-800">
                  {medicalImages.map(img => (
                    <div key={img.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-col truncate pr-2">
                        <span className="text-xs font-semibold text-text dark:text-slate-200 truncate">{img.original_name || img.file_path.split('/').pop()}</span>
                        <span className="text-[10px] text-text-light dark:text-slate-400 font-medium">
                          {img.document_type?.toLowerCase().includes('id') ? `🆔 ${img.document_type}` : img.document_type || 'Document'}
                        </span>
                      </div>
                      <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-bold">
                        Attached
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-background dark:bg-slate-950 px-3 py-2 border-t border-border dark:border-slate-800 flex justify-between items-center">
                  <p className="text-[10px] text-text-light dark:text-slate-400">
                    Visible to your doctor.
                  </p>
                  <Link to="/medical-images" className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline">Manage all files</Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border dark:border-slate-800 bg-surface dark:bg-slate-900/30 px-4 py-4 text-center">
                <p className="text-xs text-text-muted dark:text-slate-400 font-medium">No files or IDs attached yet.</p>
                <p className="text-[10px] text-text-light dark:text-slate-500 mt-0.5">Select document type and click "Attach" above.</p>
              </div>
            )}
          </div>

          
          
          </div>
<div className="lg:col-span-8 space-y-4">
<div>
            <label className="block text-sm font-medium text-text-muted mb-1">Selected Appointment Slot</label>
            {requestForm.scheduled_at ? (
              <div className="w-full px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-semibold flex items-center gap-2">
                <Calendar size={16} />
                {new Date(requestForm.scheduled_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            ) : (
              <div className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-medium text-sm">
                Please click an available green slot below.
              </div>
            )}
            <input type="text" className="h-0 w-0 absolute opacity-0" required value={requestForm.scheduled_at || ''} onChange={()=>{}} tabIndex="-1" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text">Available Appointment Slots</p>
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={() => setRequestWeekOffset(prev => prev - 1)} className="p-1 rounded-md hover:bg-surface-hover text-text-muted hover:text-text"><ChevronLeft size={16}/></button>
                  <p className="text-xs font-medium text-text-light w-32 text-center">Week of {requestWeekStart.toLocaleDateString()}</p>
                  <button type="button" onClick={() => setRequestWeekOffset(prev => prev + 1)} className="p-1 rounded-md hover:bg-surface-hover text-text-muted hover:text-text"><ChevronRight size={16}/></button>
                </div>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-text">
                Open slots can be selected
              </span>
            </div>

            {!requestForm.requested_specialization ? (
              <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-4 py-8 text-center text-sm text-text-light flex flex-col items-center justify-center gap-2">
                <Stethoscope size={24} className="text-sky-400" />
                <p className="font-medium text-text-muted">Please select a specialization to begin.</p>
                <p className="text-xs">Available doctors and their appointment slots will appear here.</p>
              </div>
            ) : matchingAvailableDoctors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50/50 px-4 py-8 text-center text-sm text-text-light flex flex-col items-center justify-center gap-2">
                <AlertCircle size={24} className="text-rose-400" />
                <p className="font-medium text-text-muted">No doctors currently handle this specialization, or the office is closed.</p>
                <p className="text-xs">Please try selecting a different specialization or check back later.</p>
              </div>
            ) : (
      <div data-tour="page-list" className="space-y-3">
                {matchingAvailableDoctors.length > 1 && (
                  <div className="flex items-center justify-between bg-surface dark:bg-slate-800/60 p-3 rounded-2xl border border-border dark:border-slate-800 gap-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setRequestDoctorIndex(prev => Math.max(prev - 1, 0))}
                      disabled={requestDoctorIndex === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border dark:border-slate-700 bg-background text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shrink-0"
                    >
                      <ChevronLeft size={15} /> Prev
                    </button>
                    <div className="text-center min-w-0">
                      <p className="text-sm font-black text-text dark:text-white truncate">
                        Dr. {(matchingAvailableDoctors[requestDoctorIndex]?.name || '').replace(/^Dr\.\s*/i, '')}
                      </p>
                      <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        Doctor {requestDoctorIndex + 1} of {matchingAvailableDoctors.length} · {matchingAvailableDoctors[requestDoctorIndex]?.specialization}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequestDoctorIndex(prev => Math.min(prev + 1, matchingAvailableDoctors.length - 1))}
                      disabled={requestDoctorIndex === matchingAvailableDoctors.length - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border dark:border-slate-700 bg-background text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shrink-0"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                )}
                {[matchingAvailableDoctors[requestDoctorIndex]].filter(Boolean).map((doctor) => (
                  <div key={`request-slots-${doctor.id}`} className="rounded-2xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900/60 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold text-lg shrink-0">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text dark:text-white">
                            Dr. {(doctor.name || '').replace(/^Dr\.\s*/i, '')}
                          </p>
                          <p className="text-xs text-text-light dark:text-slate-400">
                            {doctor.doctor_type || 'Resident Physician'} · {doctor.specialization}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                        Choose Slot Below
                      </span>
                    </div>
                    {(doctor.availability?.length > 0 || doctor.exceptions?.length > 0) ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                        {requestWeekDays.map((date) => {
                          const slots = getDoctorSlotsForDate(doctor, date);
                          const isSelectedDate = requestSelectedDateKey === date.toDateString();

                          return (
                            <div
                              key={`${doctor.id}-${date.toISOString()}`}
                              className={`min-h-28 rounded-xl border p-2.5 transition-all ${
                                isSelectedDate 
                                  ? 'border-sky-400 dark:border-sky-600 bg-sky-50/60 dark:bg-sky-950/40 shadow-sm' 
                                  : 'border-border/80 dark:border-slate-800 bg-background/80 dark:bg-slate-900/40'
                              }`}
                            >
                              <p className={`mb-2 text-xs font-bold text-center ${isSelectedDate ? 'text-sky-700 dark:text-sky-300' : 'text-text-muted dark:text-slate-400'}`}>
                                {shortDayLabel(date)}
                              </p>
                              {slots.length === 0 ? (
                                <p className="rounded-lg bg-surface/60 dark:bg-slate-800/40 px-2 py-3 text-center text-[11px] font-medium text-text-light dark:text-slate-500">
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
                                        className={`w-full rounded-xl px-2.5 py-2 text-xs font-bold transition-all border disabled:cursor-not-allowed ${
                                          isFull 
                                            ? 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 cursor-not-allowed opacity-60' 
                                            : isSelectedSlot
                                              ? 'bg-sky-600 dark:bg-sky-500 text-white border-transparent shadow-md ring-2 ring-sky-400/50'
                                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:scale-[1.02]'
                                        }`}
                                      >
                                        <div className="font-extrabold text-[11px]">{timeRangeLabel(slot)}</div>
                                        <div className={`text-[10px] mt-0.5 font-bold ${
                                          isFull 
                                            ? 'text-rose-600 dark:text-rose-400' 
                                            : isSelectedSlot 
                                              ? 'text-sky-100' 
                                              : slotStatus.remaining <= 2 
                                                ? 'text-amber-700 dark:text-amber-300 font-black' 
                                                : 'text-emerald-700 dark:text-emerald-400'
                                        }`}>
                                          {isFull ? '● Full (10/10)' : `● ${slotStatus.remaining} slots left`}
                                        </div>
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
          </div>
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
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Doctor Weekly Availability</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button type="button" onClick={() => setRescheduleWeekOffset(prev => prev - 1)} className="p-1 rounded-md hover:bg-surface-hover text-text-muted hover:text-text"><ChevronLeft size={16}/></button>
                    <p className="text-xs font-medium text-text-light">
                      Week of {rescheduleWeekStart.toLocaleDateString()} {rescheduleDoctorName ? `for Dr. ${(rescheduleDoctorName || '').replace(/^Dr\.\s*/i, '')}` : ''}
                    </p>
                    <button type="button" onClick={() => setRescheduleWeekOffset(prev => prev + 1)} className="p-1 rounded-md hover:bg-surface-hover text-text-muted hover:text-text"><ChevronRight size={16}/></button>
                  </div>
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
                                  disabled={!slot.isAvailable || isFull}
                                  onClick={() => setRescheduleForm((form) => ({ ...form, scheduled_at: dateTimeLocalValue(date, slotStart) }))}
                                  className={`w-full rounded-md px-2 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
                                    !slot.isAvailable ? 'bg-surface/50 text-text-muted/30 cursor-not-allowed border border-border' : isFull ? 'bg-danger-bg text-rose-400 line-through' : isSelectedSlot
                                      ? 'bg-sky-600 text-white shadow-sm'
                                      : 'bg-surface text-text-muted hover:bg-primary-hover hover:text-primary-text'
                                  }`}
                                >
                                  {timeRangeLabel(slot)} · <span className={
                                    !slot.isAvailable ? 'text-text-muted/50' : isFull ? 'text-rose-500' : isSelectedSlot ? 'text-sky-100' : slotStatus.remaining <= 2 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : (slotStatus.remaining / slotStatus.capacity <= 0.4) ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'
                                  }>
                                    {!slot.isAvailable ? 'Unavailable' : isFull ? 'Full' : `${slotStatus.remaining} left`}
                                  </span>
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
              <label className="block text-sm font-medium text-text-muted mb-1">Selected New Appointment Slot</label>
              {rescheduleForm.scheduled_at ? (
                <div className="w-full px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-semibold flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(rescheduleForm.scheduled_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-medium text-sm">
                  Please click an available slot above.
                </div>
              )}
              <input type="text" className="h-0 w-0 absolute opacity-0" required value={rescheduleForm.scheduled_at || ''} onChange={()=>{}} tabIndex="-1" />
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

