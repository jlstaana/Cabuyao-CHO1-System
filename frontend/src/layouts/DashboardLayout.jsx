import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LogOut, Home, Users, FileText, Activity, Bell, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading, fetchUser, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchUser();
  }, [isAuthenticated, fetchUser]);

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

  const navLinks = [
    { path: '/dashboard', label: 'Overview', icon: Home },
    { path: '/consultations', label: 'Consultations', icon: Activity },
    { path: '/prescriptions', label: 'E-Prescriptions', icon: FileText },
  ];
  
  if (user.role === 'Admin' || user.role === 'Doctor' || user.role === 'Staff') {
    navLinks.push({ path: '/medicines', label: 'Medicines', icon: FileText });
  }

  if (user.role === 'Admin' || user.role === 'Staff') {
    navLinks.push({ path: '/users', label: 'Manage Users', icon: Users });
  }

  if (user.role === 'Admin') {
    navLinks.push({ path: '/analytics', label: 'Analytics & Logs', icon: Activity });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* Top Navbar */}
      <header className="bg-sky-600 text-white shadow-md px-4 py-3 flex justify-between items-center z-30 relative">
         <div className="flex items-center gap-4">
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
            
            <h1 className="text-xl font-black tracking-tight flex items-center gap-1">
               Cabuyao<span className="text-sky-200 font-bold">CHO</span>
            </h1>
         </div>

         <div className="flex items-center gap-4">
            <button className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-500 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-sky-600"></span>
            </button>
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
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
            <p className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Menu</p>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  title={sidebarCollapsed ? link.label : ''}
                  className={`flex items-center gap-3 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'px-0 justify-center' : 'px-4'}`}
                >
                  <link.icon size={22} className={`shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} /> 
                  <span className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
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
