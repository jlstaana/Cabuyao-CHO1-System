const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
}

// 1. Reusable Modal Component
write('src/components/Modal.jsx', `
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className={\`relative bg-white rounded-2xl shadow-xl w-full \${maxWidth} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200\`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
`);

// 2. Reusable Skeleton Loader
write('src/components/Skeleton.jsx', `
export default function Skeleton({ className }) {
  return (
    <div className={\`animate-pulse bg-slate-200 rounded-md \${className}\`}></div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex gap-4 items-center mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
`);

// 3. Update DashboardLayout to include a header and profile dropdown
write('src/layouts/DashboardLayout.jsx', `
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
      <aside className={\`\${mobileMenuOpen ? 'flex' : 'hidden'} absolute md:relative z-10 md:flex w-64 bg-white border-r border-slate-200 flex-col h-full min-h-screen shadow-xl md:shadow-none transition-all\`}>
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
                className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all \${isActive ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}\`}
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
`);

// 4. Update ManageUsers to include Add User Modal and better skeletal design
write('src/pages/dashboard/ManageUsers.jsx', `
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { UserPlus, Archive, CheckCircle, Search, Filter } from 'lucide-react';
import SEO from '../../components/SEO';

export default function ManageUsers() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Simulate network loading skeletal states
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'Dr. Jane Smith', email: 'doctor@cabuyao.gov.ph', role: 'Doctor', active: true },
        { id: 2, name: 'John Desk', email: 'staff@cabuyao.gov.ph', role: 'Staff', active: true },
        { id: 3, name: 'Juan Dela Cruz', email: 'patient@gmail.com', role: 'Patient', active: false },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (user?.role !== 'Admin' && user?.role !== 'Staff') {
    return <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">You do not have permission to view this page.</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SEO title="Manage Users" description="System Administrator User Management" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage System Users</h1>
          <p className="text-slate-500 mt-1">Create and manage accounts for doctors, staff, and patients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl hover:bg-sky-600 transition-all shadow-md shadow-sky-200 font-medium active:scale-95"
        >
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50 focus:bg-white transition-all" />
           </div>
           <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select className="pl-10 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none bg-slate-50 transition-all font-medium text-slate-700">
                  <option>All Roles</option>
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Staff</option>
                  <option>Patient</option>
              </select>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="px-6 py-4 font-semibold tracking-wide">User Profile</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Role</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                // Skeletal Rows
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
                           {u.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{u.name}</p>
                           <p className="text-sm text-slate-500">{u.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        \${u.role === 'Admin' ? 'bg-fuchsia-100 text-fuchsia-700' : 
                          u.role === 'Doctor' ? 'bg-sky-100 text-sky-700' : 
                          u.role === 'Staff' ? 'bg-amber-100 text-amber-700' : 
                          'bg-slate-100 text-slate-700'}
                      \`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.active ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 px-2.5 py-1 rounded-md w-fit"><CheckCircle size={16} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold bg-slate-100 px-2.5 py-1 rounded-md w-fit"><Archive size={16} /> Archived</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sky-600 hover:text-sky-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors mr-2">Edit</button>
                      <button className="text-rose-500 hover:text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">Deactivate</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New User Account"
      >
        <form className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" placeholder="e.g. Dr. Juan Santos" />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" placeholder="user@cabuyao.gov.ph" />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Role</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-white">
                 <option>Doctor</option>
                 <option>Staff</option>
                 <option>Admin</option>
              </select>
           </div>
           <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={() => {toast.success('User generated successfully!'); setIsModalOpen(false);}} className="px-5 py-2.5 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-xl shadow-md shadow-sky-200 transition-all">Create Account</button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
`);
