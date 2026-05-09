import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LogOut, Home, Users, FileText, Activity, Bell, Menu, X, User } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading, fetchUser, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  
  if (user.role === 'Admin' || user.role === 'Staff') {
    navLinks.push({ path: '/users', label: 'Manage Users', icon: Users });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Navbar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold text-sky-600">Cabuyao CHO</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'flex' : 'hidden'} absolute md:relative z-10 md:flex w-64 bg-white border-r border-slate-200 flex-col h-full min-h-screen shadow-xl md:shadow-none transition-all`}>
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <h1 className="text-2xl font-black text-sky-600 tracking-tight">Cabuyao<span className="text-slate-800">CHO</span></h1>
          <p className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase mt-2 inline-block tracking-wider">{user.role} Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 md:mt-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu</p>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <link.icon size={20} className={isActive ? 'text-sky-500' : 'text-slate-400'} /> {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold">
               {user.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-semibold truncate">{user.name}</p>
               <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium">
            <LogOut size={20} className="text-slate-400 hover:text-rose-500" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center hidden md:flex sticky top-0 z-10">
           <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
           </h2>
           <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
           </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
