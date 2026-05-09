const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
}

// Manage Users Page
write('src/pages/dashboard/ManageUsers.jsx', `
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, Archive, CheckCircle } from 'lucide-react';

export default function ManageUsers() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  
  if (user?.role !== 'Admin' && user?.role !== 'Staff') {
    return <div className="p-8 text-center text-slate-500">You do not have permission to view this page.</div>;
  }

  // Placeholder static data for UI
  const mockUsers = [
    { id: 1, name: 'Dr. John Doe', email: 'john@example.com', role: 'Doctor', active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Staff', active: true },
    { id: 3, name: 'Mark Patient', email: 'mark@example.com', role: 'Patient', active: false },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-500">Create and manage accounts for doctors, staff, and patients.</p>
        </div>
        <button className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
           <input type="text" placeholder="Search users..." className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
           <select className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white">
              <option>All Roles</option>
              <option>Doctor</option>
              <option>Staff</option>
              <option>Patient</option>
           </select>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map(u => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{u.name}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">{u.role}</span>
                </td>
                <td className="p-4">
                  {u.active ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"><CheckCircle size={16} /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400 text-sm font-medium"><Archive size={16} /> Archived</span>
                  )}
                </td>
                <td className="p-4">
                  <button className="text-sky-600 hover:text-sky-800 text-sm font-medium mr-3">Edit</button>
                  <button className="text-rose-500 hover:text-rose-700 text-sm font-medium">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

// Consultations Page
write('src/pages/dashboard/Consultations.jsx', `
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Video, FilePlus, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function Consultations() {
  const { user } = useAuthStore();

  const mockConsultations = [
    { id: 1, patient: 'Alice Reyes', status: 'Pending', date: '2026-05-10', time: '10:00 AM' },
    { id: 2, patient: 'Bob Santos', status: 'Scheduled', date: '2026-05-09', time: '02:30 PM' },
    { id: 3, patient: 'Charlie Cruz', status: 'Completed', date: '2026-05-08', time: '11:00 AM' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Scheduled': return 'bg-sky-100 text-sky-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teleconsultations</h1>
          <p className="text-slate-500">Manage and conduct online patient visits.</p>
        </div>
        {user?.role === 'Patient' && (
          <button className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
            <Calendar size={18} /> Request Consultation
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockConsultations.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{c.patient}</h3>
              <span className={\`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider \${getStatusColor(c.status)}\`}>
                {c.status}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-slate-600"><Calendar size={16} className="text-slate-400" /> {c.date}</p>
              <p className="text-sm flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400" /> {c.time}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {c.status === 'Scheduled' && (
                <button className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                  <Video size={18} /> Join Call
                </button>
              )}
              {c.status === 'Completed' && user?.role === 'Doctor' && (
                <button className="flex-1 flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-2 rounded-lg font-medium hover:bg-sky-100 transition-colors">
                  <FilePlus size={18} /> E-Prescribe
                </button>
              )}
              {c.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Staff') && (
                <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                  <CheckCircle size={18} /> Approve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

// E-Prescriptions Page
write('src/pages/dashboard/Prescriptions.jsx', `
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Download, FileText, Pill } from 'lucide-react';

export default function Prescriptions() {
  const { user } = useAuthStore();

  const mockPrescriptions = [
    { id: 101, patient: 'Alice Reyes', doctor: 'Dr. John Doe', date: '2026-05-08', medicines: 2 },
    { id: 102, patient: 'Bob Santos', doctor: 'Dr. John Doe', date: '2026-05-07', medicines: 1 },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-Prescriptions</h1>
          <p className="text-slate-500">View and download digital medical prescriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockPrescriptions.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                    <FileText size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-slate-900">RX-{p.id}</h3>
                    <p className="text-sm text-slate-500">{p.date}</p>
                 </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
               <p className="text-sm text-slate-700"><span className="font-medium">Patient:</span> {p.patient}</p>
               <p className="text-sm text-slate-700"><span className="font-medium">Prescribed by:</span> {p.doctor}</p>
               <p className="text-sm text-slate-700 flex items-center gap-1"><Pill size={14} className="text-slate-400"/> {p.medicines} items prescribed</p>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 hover:text-sky-600 transition-colors">
              <Download size={18} /> Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

// Update App.jsx to include these new routes
write('src/App.jsx', `
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import ManageUsers from './pages/dashboard/ManageUsers';
import Consultations from './pages/dashboard/Consultations';
import Prescriptions from './pages/dashboard/Prescriptions';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`);
