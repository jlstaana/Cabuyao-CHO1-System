import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Filter, FileText, Users, CheckCircle, X, Stethoscope, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import PageTitle from '../../components/PageTitle';

const ROLE_FILTERS = {
  Admin: ['All', 'Unread', 'Consultation', 'Account', 'System'],
  Doctor: ['All', 'Unread', 'Consultation', 'Prescription', 'System'],
  Patient: ['All', 'Unread', 'Consultation', 'Prescription', 'System'],
  Staff: ['All', 'Unread', 'Consultation', 'Account', 'System'],
};

const CATEGORY_BADGE = {
  info: 'bg-primary-hover text-primary-text',
  success: 'bg-emerald-100 text-success-text',
  warning: 'bg-amber-100 text-warning-text',
  error: 'bg-rose-100 text-rose-700',
};

const TYPE_ICON = {
  consultation: Stethoscope,
  prescription: FileText,
  account: Users,
  system: ShieldCheck,
};

const readStorageKey = (userId) => `cho1-read-notifications-${userId || 'guest'}`;

function getStoredReadIds(userId) {
  try {
    return JSON.parse(localStorage.getItem(readStorageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

function storeReadIds(userId, ids) {
  localStorage.setItem(readStorageKey(userId), JSON.stringify(Array.from(new Set(ids))));
}

function buildConsultationNotifications(consultations, role, readIds = []) {
  const readSet = new Set(readIds);

  return consultations.slice(0, 20).map((consultation) => {
    const isPatient = role === 'Patient';
    const otherPerson = isPatient
      ? consultation.doctor?.user?.name || 'Assigned doctor'
      : consultation.patient?.user?.name || 'Patient';
    const title = consultation.status === 'Completed'
      ? 'Consultation Completed'
      : consultation.status === 'Scheduled'
        ? 'Consultation Scheduled'
        : consultation.status === 'Pending'
          ? 'Consultation Queued'
          : 'Consultation Update';
    const message = consultation.status === 'Scheduled'
      ? `${isPatient ? `Dr. ${(otherPerson || '').replace(/^Dr\.\s*/i, '')}` : `Patient ${otherPerson}`} is scheduled${consultation.scheduled_at ? ` for ${new Date(consultation.scheduled_at).toLocaleString()}` : ''}.`
      : consultation.status === 'Pending'
        ? `${isPatient ? 'Your request' : `Patient ${otherPerson}`} is queued until a doctor confirms availability${consultation.scheduled_at ? ` for ${new Date(consultation.scheduled_at).toLocaleString()}` : ''}.`
        : `${isPatient ? otherPerson : `Patient ${otherPerson}`} - ${consultation.status}`;
    const targetPath = consultation.status === 'Scheduled'
      ? `/room/${consultation.id}`
      : consultation.status === 'Completed' && consultation.prescription?.id
        ? '/prescriptions'
        : role === 'Patient' && consultation.status === 'Completed'
          ? '/consultation-history'
          : role === 'Doctor' && consultation.status === 'Completed'
            ? '/patient-records'
            : '/consultations';

    return {
      id: `consultation-${consultation.id}`,
      type: 'consultation',
      category: consultation.status === 'Completed' ? 'success' : consultation.status === 'Cancelled' ? 'error' : 'info',
      title,
      message,
      time: consultation.updated_at ? new Date(consultation.updated_at).toLocaleString() : 'N/A',
      read: readSet.has(`consultation-${consultation.id}`),
      iconBg: 'bg-primary-hover',
      iconColor: 'text-primary-text',
      targetPath,
    };
  });
}

function buildPrescriptionNotifications(prescriptions, role, readIds = []) {
  const readSet = new Set(readIds);

  return prescriptions.slice(0, 20).map((prescription) => {
    const isPatient = role === 'Patient';
    const otherPerson = isPatient
      ? prescription.doctor?.user?.name || 'Assigned doctor'
      : prescription.patient?.user?.name || 'Patient';
    const createdAt = prescription.created_at ? new Date(prescription.created_at).getTime() : 0;
    const updatedAt = prescription.updated_at ? new Date(prescription.updated_at).getTime() : 0;
    const wasUpdated = updatedAt > createdAt + 1000;

    return {
      id: `prescription-${prescription.id}`,
      type: 'prescription',
      category: wasUpdated ? 'info' : 'success',
      title: wasUpdated ? 'Prescription Updated' : 'Prescription Available',
      message: wasUpdated
        ? `${isPatient ? `Dr. ${(otherPerson || '').replace(/^Dr\.\s*/i, '')}` : `Prescription for ${otherPerson}`} updated an e-prescription.`
        : `${isPatient ? `Dr. ${(otherPerson || '').replace(/^Dr\.\s*/i, '')}` : `Prescription for ${otherPerson}`} created an e-prescription.`,
      time: prescription.updated_at ? new Date(prescription.updated_at).toLocaleString() : 'N/A',
      read: readSet.has(`prescription-${prescription.id}`),
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      targetPath: '/prescriptions',
    };
  });
}

export default function Notifications() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || 'Patient';
  const filters = ROLE_FILTERS[role] || ROLE_FILTERS.Patient;

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let isActive = true;
    Promise.all([api.get('/consultations'), api.get('/prescriptions')])
      .then(([consultationRes, prescriptionRes]) => {
        if (isActive) {
          const readIds = getStoredReadIds(user?.id);
          setNotifications([
            ...buildConsultationNotifications(consultationRes.data || [], role, readIds),
            ...buildPrescriptionNotifications(prescriptionRes.data || [], role, readIds),
          ].sort((a, b) => new Date(b.time) - new Date(a.time)));
        }
      })
      .catch(() => {
        if (isActive) setNotifications([]);
      });
    return () => { isActive = false; };
  }, [role, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    return n.type.toLowerCase() === activeFilter.toLowerCase();
  });

  const markAllRead = () => {
    setNotifications((prev) => {
      storeReadIds(user?.id, prev.map((n) => n.id));
      return prev.map((n) => ({ ...n, read: true }));
    });
    setSelectedIds([]);
  };

  const markOneRead = (id) => {
    setNotifications((prev) => {
      storeReadIds(user?.id, [...getStoredReadIds(user?.id), id]);
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
  };

  const openNotification = (notification) => {
    if (!notification.read) markOneRead(notification.id);
    if (notification.targetPath) navigate(notification.targetPath);
  };

  const deleteOne = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const deleteSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setSelectedIds([]);
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((n) => n.id));

  const PAGE_META = {
    Admin: { title: 'Admin Notifications', sub: 'System alerts, account activity, and administrative updates.' },
    Doctor: { title: 'My Notifications', sub: 'Consultation requests, patient updates, and prescription activity.' },
    Patient: { title: 'My Notifications', sub: 'Updates on your consultations, prescriptions, and health reminders.' },
    Staff: { title: 'Staff Notifications', sub: 'Pending approvals, consultation updates, and patient registration activity.' },
  };
  const meta = PAGE_META[role] || PAGE_META.Patient;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <PageTitle icon={Bell} title={meta.title} description={meta.sub} iconClassName="bg-primary-bg text-primary-text" />
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold bg-rose-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedIds.length > 0 && (
            <button onClick={deleteSelected} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-bg text-danger-text hover:bg-rose-100 font-medium text-sm transition-colors">
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={markAllRead} disabled={unreadCount === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-bg text-primary-text hover:bg-primary-hover font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </header>

      <div data-tour="page-filters" className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter size={16} className="text-text-light shrink-0" />
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeFilter === f
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-200'
                : 'bg-surface text-text-muted border border-border hover:border-sky-300 hover:text-primary-text'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedIds.length === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm text-text-muted cursor-pointer select-none">
            Select all ({filtered.length})
          </label>
        </div>
      )}

      <div data-tour="page-list" className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-surface-hover/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-text-light opacity-60" />
            </div>
            <h3 className="font-semibold text-slate-700 text-lg">No notifications</h3>
            <p className="text-text-light text-sm mt-1">Notifications will appear when system records change.</p>
          </div>
        ) : (
          filtered.map((notification) => {
            const Icon = TYPE_ICON[notification.type] || CheckCircle;
            const isSelected = selectedIds.includes(notification.id);
            return (
              <div
                key={notification.id}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  !notification.read
                    ? 'bg-surface border-sky-200 shadow-sm shadow-sky-50'
                    : 'bg-surface border-border opacity-80'
                } ${isSelected ? 'ring-2 ring-sky-400' : 'hover:shadow-md dark:hover:shadow-none hover:border-border dark:hover:border-zinc-800'}`}
                onClick={() => openNotification(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openNotification(notification);
                  }
                }}
              >
                <div className="pt-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(notification.id)} className="w-4 h-4 rounded accent-sky-600 cursor-pointer" />
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.iconBg}`}>
                  <Icon size={22} className={notification.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-text leading-snug ${notification.read ? 'font-medium text-text-muted' : ''}`}>
                        {notification.title}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_BADGE[notification.category]}`}>
                        {notification.category}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteOne(notification.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-light hover:text-danger-text hover:bg-danger-bg transition-all duration-200 flex-shrink-0"
                      title="Delete"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">{notification.message}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-light font-medium">
                    <span>{notification.time}</span>
                    {notification.targetPath && (
                      <>
                        <span>·</span>
                        <span className="text-primary-text group-hover:underline">Open details</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <p className="text-center text-xs text-text-light mt-8">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
}
