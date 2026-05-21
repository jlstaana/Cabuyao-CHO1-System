import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import CHOLogo from '../components/CHOLogo';
import {
  LogOut, Home, Users, FileText, Bell, Menu, X, Pill,
  BarChart2, ClipboardList, Stethoscope, ShieldCheck,
  HeartPulse, ImagePlus, Clock, UserCircle,
} from 'lucide-react';

// ─── Nav link groups by role ──────────────────────────────────────────────────
function buildNavGroups(role) {
  // ── Patient ──────────────────────────────────────────────────────────────
  if (role === 'Patient') {
    return [
      {
        label: 'My Health',
        links: [
          { path: '/dashboard',            label: 'Overview',            icon: Home },
          { path: '/vitals',               label: 'Record Vital Signs',  icon: HeartPulse },
          { path: '/medical-images',       label: 'Medical Images',      icon: ImagePlus },
        ],
      },
      {
        label: 'Consultations',
        links: [
          { path: '/consultations',        label: 'Request Teleconsult',   icon: Stethoscope },
          { path: '/consultation-history', label: 'Consultation History',  icon: Clock },
        ],
      },
      {
        label: 'Prescriptions',
        links: [
          { path: '/prescriptions',        label: 'My Prescriptions',      icon: FileText },
        ],
      },
    ];
  }

  // ── Doctor ───────────────────────────────────────────────────────────────
  if (role === 'Doctor') {
    return [
      {
        label: 'Dashboard',
        links: [
          { path: '/dashboard',     label: 'Overview',               icon: Home },
        ],
      },
      {
        label: 'Consultations',
        links: [
          { path: '/consultations',  label: 'Consultation Queue',      icon: Stethoscope },
          { path: '/patient-records', label: 'Patient Records',        icon: ClipboardList },
        ],
      },
      {
        label: 'Prescriptions',
        links: [
          { path: '/prescriptions', label: 'Create E-Prescription',   icon: FileText },
          { path: '/medicines',     label: 'Medicine Database',       icon: Pill },
        ],
      },
    ];
  }

  // ── Admin / Health Officer ────────────────────────────────────────────────
  if (role === 'Admin') {
    return [
      {
        label: 'Overview',
        links: [
          { path: '/dashboard',     label: 'Dashboard',              icon: Home },
        ],
      },
      {
        label: 'Patient Records',
        links: [
          { path: '/consultations', label: 'View Patient Records',   icon: ClipboardList },
        ],
      },
      {
        label: 'Account Management',
        links: [
          { path: '/users',         label: 'Manage Users',           icon: Users },
        ],
      },
      {
        label: 'Medicine Database',
        links: [
          { path: '/medicines',     label: 'Medicine List',          icon: Pill },
        ],
      },
      {
        label: 'Reports & Logs',
        links: [
          { path: '/analytics',     label: 'Analytics & Reports',    icon: BarChart2 },
        ],
      },
    ];
  }

  // ── Staff (fallback) ─────────────────────────────────────────────────────
  return [
    {
      label: 'Menu',
      links: [
        { path: '/dashboard',     label: 'Overview',          icon: Home },
        { path: '/consultations', label: 'Consultations',     icon: Stethoscope },
        { path: '/prescriptions', label: 'E-Prescriptions',  icon: FileText },
        { path: '/medicines',     label: 'Medicine List',     icon: Pill },
        { path: '/users',         label: 'Manage Users',      icon: Users },
      ],
    },
  ];
}

function consultationPartyName(consultation, role) {
  if (role === 'Patient') {
    return consultation.doctor?.user?.name ? `Dr. ${(consultation.doctor.user.name || '').replace(/^Dr\.\s*/i, '')}` : 'your doctor';
  }

  return consultation.patient?.user?.name || 'your patient';
}

function notifyUpcomingConsultation(consultation, user) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const scheduledAt = new Date(consultation.scheduled_at);
  const otherParty = consultationPartyName(consultation, user.role);

  new Notification('Upcoming teleconsultation', {
    body: `${otherParty} is scheduled at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    tag: `teleconsult-${consultation.id}-${scheduledAt.getTime()}`,
  });
}

async function ensureNotificationPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  }

  return Notification.requestPermission();
}

export default function DashboardLayout() {
  const { isAuthenticated, loading, fetchUser, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) fetchUser();
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (!user || !['Patient', 'Doctor'].includes(user.role)) return undefined;

    let stopped = false;
    const notifiedKey = `teleconsult-reminders:${user.id}`;
    const getNotified = () => {
      try {
        return JSON.parse(localStorage.getItem(notifiedKey) || '{}');
      } catch {
        return {};
      }
    };
    const saveNotified = (value) => localStorage.setItem(notifiedKey, JSON.stringify(value));

    const checkUpcoming = async () => {
      try {
        const { data } = await api.get('/consultations');
        if (stopped) return;

        const now = Date.now();
        const notified = getNotified();
        const upcoming = (data || []).filter((consultation) => (
          consultation.status === 'Scheduled'
          && consultation.scheduled_at
          && new Date(consultation.scheduled_at).getTime() > now
          && new Date(consultation.scheduled_at).getTime() - now <= 30 * 60 * 1000
        ));

        if (upcoming.length && 'Notification' in window && Notification.permission === 'default') {
          await ensureNotificationPermission();
        }

        upcoming.forEach((consultation) => {
          const scheduledAt = new Date(consultation.scheduled_at).getTime();
          const reminderId = `${consultation.id}:${scheduledAt}`;
          if (notified[reminderId]) return;

          notifyUpcomingConsultation(consultation, user);
          notified[reminderId] = true;
        });

        saveNotified(notified);
      } catch {
        // Notification checks should never interrupt dashboard use.
      }
    };

    checkUpcoming();
    const interval = window.setInterval(checkUpcoming, 60 * 1000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [user]);

  // Fetch unread notifications count for ALL roles
  useEffect(() => {
    if (!user) return undefined;
    
    let isNotifActive = true;
    const fetchUnreadCount = async () => {
      try {
        const [consultationRes, prescriptionRes] = await Promise.all([
          api.get('/consultations'),
          api.get('/prescriptions')
        ]);
        if (!isNotifActive) return;

        const readIds = JSON.parse(localStorage.getItem(`cho1-read-notifications-${user.id || 'guest'}`) || '[]');
        const readSet = new Set(readIds);
        
        let count = 0;
        const processItems = (items, prefix) => {
          (items || []).slice(0, 20).forEach(item => {
            if (!readSet.has(`${prefix}-${item.id}`)) count++;
          });
        };
        
        processItems(consultationRes.data, 'consultation');
        processItems(prescriptionRes.data, 'prescription');
        
        setUnreadNotifications(count);
      } catch (error) {
        // Silently fail for background check
      }
    };
    
    fetchUnreadCount();
    const notifInterval = window.setInterval(fetchUnreadCount, 30 * 1000);

    return () => {
      isNotifActive = false;
      window.clearInterval(notifInterval);
    };
  }, [user]);

  if (!isAuthenticated && !loading) return <Navigate to="/login" replace />;
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = buildNavGroups(user.role);

  // Role badge config
  const roleBadge = {
    Admin:   { label: 'Health Officer / Admin', color: 'bg-sky-50 border-sky-100 text-sky-700', icon: ShieldCheck },
    Doctor:  { label: 'Doctor',                 color: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: Stethoscope },
    Staff:   { label: 'Staff',                  color: 'bg-amber-50 border-amber-100 text-amber-700', icon: Users },
    Patient: { label: 'Patient',                color: 'bg-indigo-50 border-indigo-100 text-indigo-700', icon: UserCircle },
  };
  const badge = roleBadge[user.role];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* Top Navbar */}
      <header className="bg-sky-600 text-white shadow-md px-4 py-3 flex justify-between items-center z-30 relative">
         <div className="flex items-center gap-4">
            <CHOLogo light to="/dashboard" />
            {/* Desktop Sidebar Toggle */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="hidden md:flex p-2 hover:bg-sky-500 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 hover:bg-sky-500 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
         </div>

         <div className="flex items-center gap-4">
            {/* Bell → Notifications page */}
            <Link to="/notifications" className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-500 rounded-full transition-colors">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full border-2 border-sky-600 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            <div className="hidden md:block text-right mr-2">
               <p className="text-sm font-semibold leading-tight">{user.name}</p>
               <p className="text-xs text-sky-200 leading-tight">{user.role}</p>
            </div>
            <Link to="/profile" className="w-10 h-10 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center font-bold shadow-inner transition-colors cursor-pointer border-2 border-sky-400">
               {user.name.charAt(0)}
            </Link>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-10 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}

        {/* Sidebar */}
        <aside 
          className={`absolute md:relative z-20 flex flex-col bg-white border-r border-slate-200 h-full shadow-2xl md:shadow-none transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Role badge */}
          {!sidebarCollapsed && badge && (
            <div className={`mx-4 mt-4 mb-1 flex items-center gap-2 border rounded-xl px-3 py-2 ${badge.color}`}>
              <badge.icon size={15} className="shrink-0" />
              <span className="text-xs font-semibold truncate">{badge.label}</span>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-2">
                {/* Group label */}
                <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-3 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'}`}>
                  {group.label}
                </p>
                {group.links.map((link, idx) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={`${group.label}-${link.path}-${idx}`}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      title={sidebarCollapsed ? link.label : ''}
                      className={`flex items-center gap-3 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${sidebarCollapsed ? 'px-0 justify-center' : 'px-4'}`}
                    >
                      <link.icon size={20} className={`shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                      <span className={`transition-all duration-300 text-sm ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout} 
              className={`flex items-center gap-3 py-3 w-full rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
            >
              <LogOut size={22} className="shrink-0 text-slate-400 hover:text-rose-500" /> 
              <span className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
