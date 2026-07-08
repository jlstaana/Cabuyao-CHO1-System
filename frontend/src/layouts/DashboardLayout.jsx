import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';
import CHOLogo from '../components/CHOLogo';
import SEO from '../components/SEO';
import OnboardingTutorial from '../components/OnboardingTutorial';
import {
  LogOut, Users, Bell, Menu, X,
  Stethoscope, ShieldCheck,
  UserCircle, HelpCircle, Sun, Moon,
} from 'lucide-react';
import useThemeStore from '../store/useThemeStore';

import { buildNavGroups } from '../utils/navigation';

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
  const { isAuthenticated, loading, user, fetchUser, logout, completeOnboarding } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getSeoTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Overview';
    if (path.includes('/vitals')) return 'Vital Signs';
    if (path.includes('/medical-images')) return 'Medical Images';
    if (path.includes('/consultations')) return 'Consultations';
    if (path.includes('/consultation-history')) return 'Consultation History';
    if (path.includes('/prescriptions')) return 'Prescriptions';
    if (path.includes('/medicines')) return 'Medicine Database';
    if (path.includes('/users')) return 'Manage Users';
    if (path.includes('/analytics')) return 'Analytics & Reports';
    if (path.includes('/patient-records')) return 'Patient Records';
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/room/')) return 'Teleconsultation Room';
    return 'Dashboard';
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialReplay, setTutorialReplay] = useState(false);
  const [prevTutorialOpen, setPrevTutorialOpen] = useState(tutorialOpen);
  if (tutorialOpen !== prevTutorialOpen) {
    setPrevTutorialOpen(tutorialOpen);
    if (tutorialOpen) {
      setSidebarCollapsed(true);
      setMobileMenuOpen(false);
    }
  }

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
        
        const pushedKey = `cho1-pushed-notifications-${user.id || 'guest'}`;
        const pushedIds = JSON.parse(localStorage.getItem(pushedKey) || '[]');
        const pushedSet = new Set(pushedIds);

        let count = 0;
        let newToPush = [];

        const processItems = (items, prefix, titlePrefix) => {
          (items || []).slice(0, 20).forEach(item => {
            const notifId = `${prefix}-${item.id}`;
            if (!readSet.has(notifId)) {
              count++;
              // Only push if it was created/updated in the last hour to prevent spamming old unread items on first login
              const isRecent = new Date(item.updated_at || item.created_at).getTime() > Date.now() - 3600000;
              if (isRecent && !pushedSet.has(notifId)) {
                newToPush.push({ id: notifId, title: `New ${titlePrefix} Update`, body: `Check your notifications for the latest update regarding your ${titlePrefix.toLowerCase()}.` });
                pushedSet.add(notifId);
              }
            }
          });
        };
        
        processItems(consultationRes.data, 'consultation', 'Consultation');
        processItems(prescriptionRes.data, 'prescription', 'Prescription');
        
        if (newToPush.length > 0) {
          localStorage.setItem(pushedKey, JSON.stringify(Array.from(pushedSet)));
          if ('Notification' in window && Notification.permission === 'default') {
            await ensureNotificationPermission();
          }
          if ('Notification' in window && Notification.permission === 'granted') {
            newToPush.forEach(notif => {
              new Notification(notif.title, { body: notif.body, tag: notif.id });
            });
          }
        }

        setUnreadNotifications(count);
      } catch {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenTutorial = () => {
    setTutorialReplay(true);
    setTutorialOpen(true);
  };

  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    setTutorialReplay(false);
    setMobileMenuOpen(false);
  };

  const handleCompleteTutorial = async () => {
    if (user.first_login) {
      await completeOnboarding();
    }
    handleCloseTutorial();
  };

  const navGroups = buildNavGroups(user.role);

  // Role badge config
  const roleBadge = {
    Admin:   { label: 'Health Officer / Admin', color: 'bg-primary-bg border-sky-100 text-primary-text', icon: ShieldCheck },
    Doctor:  { label: 'Doctor',                 color: 'bg-success-bg border-success-border text-success-text', icon: Stethoscope },
    Staff:   { label: 'Staff',                  color: 'bg-warning-bg border-warning-border text-warning-text', icon: Users },
    Patient: { label: 'Patient',                color: 'bg-brand-bg border-brand-border text-brand-text', icon: UserCircle },
  };
  const badge = roleBadge[user.role];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-text overflow-hidden transition-colors duration-300">
      <SEO title={getSeoTitle()} />
      
      {/* Top Navbar */}
      <header data-tour="topbar" className="bg-sky-600 text-white shadow-md px-4 py-3 flex justify-between items-center z-30 relative">
         <div className="flex items-center gap-4">
            <CHOLogo light to="/dashboard" />
            {/* Desktop Sidebar Toggle */}
            <button 
              data-tour="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="hidden md:flex p-2 hover:bg-sky-500 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            {/* Mobile Sidebar Toggle */}
            <button 
              data-tour="sidebar-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 hover:bg-sky-500 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
         </div>

         <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-500 rounded-full transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              data-tour="help"
              type="button"
              onClick={handleOpenTutorial}
              className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-500 rounded-full transition-colors"
              title="Open tutorial"
              aria-label="Open tutorial"
            >
              <HelpCircle size={20} />
            </button>
            {/* Bell → Notifications page */}
            <Link data-tour="notifications" to="/notifications" className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-500 rounded-full transition-colors">
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
            <Link data-tour="profile" to="/profile" className="w-10 h-10 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center font-bold shadow-inner transition-colors cursor-pointer border-2 border-sky-400">
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
          data-tour="sidebar"
          className={`absolute md:relative z-20 flex flex-col bg-surface border-r border-border dark:border-slate-800 h-full shadow-2xl md:shadow-none transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
          {/* Role badge */}
          {!sidebarCollapsed && badge && (
            <div data-tour="role-badge" className={`mx-4 mt-4 mb-1 flex items-center gap-2 border rounded-xl px-3 py-2 ${badge.color}`}>
              <badge.icon size={15} className="shrink-0" />
              <span className="text-xs font-semibold truncate">{badge.label}</span>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-2">
                {/* Group label */}
                <p className={`text-[10px] font-bold text-text-light uppercase tracking-widest mb-1 px-3 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'}`}>
                  {group.label}
                </p>
                {group.links.map((link, idx) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      data-tour={`nav-${link.path === '/dashboard' ? 'dashboard' : link.path.replace('/', '')}`}
                      key={`${group.label}-${link.path}-${idx}`}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      title={sidebarCollapsed ? link.label : ''}
                      className={`flex items-center gap-3 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive ? 'bg-primary-bg text-primary-text shadow-sm' : 'text-text-muted hover:bg-surface-hover hover:text-slate-900 dark:hover:text-white'
                      } ${sidebarCollapsed ? 'px-0 justify-center' : 'px-4'}`}
                    >
                      <link.icon size={20} className={`shrink-0 ${isActive ? 'text-sky-500' : 'text-text-light'}`} />
                      <span className={`transition-all duration-300 text-sm ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          
          <div className="p-4 border-t border-border">
            <button 
              data-tour="logout"
              onClick={handleLogout} 
              className={`flex items-center gap-3 py-3 w-full rounded-xl text-text-muted hover:bg-danger-bg hover:text-danger-text transition-colors font-medium ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
            >
              <LogOut size={22} className="shrink-0 text-text-light hover:text-danger-text" /> 
              <span className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main data-tour="main-content" className="flex-1 overflow-y-auto bg-background relative p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <OnboardingTutorial
        user={user}
        pathname={location.pathname}
        navigate={navigate}
        open={tutorialOpen}
        forced={Boolean(user.first_login && !tutorialReplay)}
        onClose={handleCloseTutorial}
        onComplete={handleCompleteTutorial}
      />
    </div>
  );
}
