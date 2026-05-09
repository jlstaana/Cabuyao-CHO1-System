const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
}

// Update index.css
write('src/index.css', `
@import "tailwindcss";

@theme {
  --color-primary: #0ea5e9;
  --color-primary-dark: #0284c7;
  --color-secondary: #f43f5e;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`);

// API Client
write('src/utils/api.js', `
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`);

// Auth Store
write('src/store/useAuthStore.js', `
import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/user');
      set({ user: response.data, isAuthenticated: true, loading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  }
}));

export default useAuthStore;
`);

// Layouts
write('src/layouts/AuthLayout.jsx', `
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <Outlet />
      </div>
    </div>
  );
}
`);

write('src/layouts/DashboardLayout.jsx', `
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
`);

// Pages
write('src/pages/Landing.jsx', `
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-sky-600 tracking-tighter">Cabuyao<span className="text-slate-800">CHO</span></h1>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 font-medium hover:text-sky-600 transition-colors">Login</Link>
          <Link to="/register" className="bg-sky-500 text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all transform hover:-translate-y-0.5">Register</Link>
        </div>
      </nav>
      <main className="container mx-auto px-6 pt-24 pb-12 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Modern Healthcare <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">at Your Fingertips.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
            Access teleconsultations, digital prescriptions, and secure health records seamlessly through the Cabuyao City Health Office Portal.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-xl">Get Started</Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-indigo-200 rounded-[3rem] rotate-3 scale-105 opacity-50 blur-2xl"></div>
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl relative border border-white/50 backdrop-blur-sm">
             <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-sky-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-sm font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">Doctor Available</div>
             </div>
             <div className="space-y-4">
                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
`);

write('src/pages/auth/Login.jsx', `
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const login = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-slate-500 mt-2 text-sm">Sign in to your Cabuyao CHO account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            {...register('email', { required: true })} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            type="password"
            {...register('password', { required: true })} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
            placeholder="••••••••"
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 disabled:opacity-70 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-slate-600">
        Don't have an account? <Link to="/register" className="text-sky-600 font-semibold hover:underline">Register here</Link>
      </p>
    </div>
  );
}
`);

write('src/pages/dashboard/Overview.jsx', `
import useAuthStore from '../../store/useAuthStore';
import { Activity, Users, FileText, TrendingUp } from 'lucide-react';

export default function Overview() {
  const { user } = useAuthStore();

  const stats = [
    { label: 'Total Consultations', value: '1,284', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-100' },
    { label: 'Active Patients', value: '8,430', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { label: 'Prescriptions Issued', value: '3,105', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { label: 'Health Index', value: '92%', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-100' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={\`p-3 rounded-xl \${stat.bg} \${stat.color}\`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-96">
            <h3 className="font-semibold text-slate-900 mb-4">Consultation Volume Trends</h3>
            <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-slate-400">Chart rendering area (Recharts)</p>
            </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 mt-2 rounded-full bg-sky-500"></div>
                    <div>
                        <p className="text-sm font-medium text-slate-800">New teleconsultation requested</p>
                        <p className="text-xs text-slate-500">10 minutes ago</p>
                    </div>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </div>
  );
}
`);

// App.jsx
write('src/App.jsx', `
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/dashboard/Overview';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Overview />} />
          {/* Add other protected routes here */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`);
