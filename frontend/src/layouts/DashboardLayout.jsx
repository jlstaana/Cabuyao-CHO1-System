import { useEffect } from 'react';
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LogOut, Home, Users, FileText, Activity } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading, fetchUser, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchUser();
  }, [isAuthenticated, fetchUser]);

  if (!isAuthenticated && !loading) return <Navigate to="/login" replace />;
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-sky-600">Cabuyao CHO</h1>
          <p className="text-xs text-slate-500 uppercase mt-1 tracking-wider">{user.role} Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 font-medium">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/consultations" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Activity size={20} /> Consultations
          </Link>
          <Link to="/prescriptions" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <FileText size={20} /> E-Prescriptions
          </Link>
          {(user.role === 'Admin' || user.role === 'Staff') && (
            <Link to="/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Users size={20} /> Manage Users
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
