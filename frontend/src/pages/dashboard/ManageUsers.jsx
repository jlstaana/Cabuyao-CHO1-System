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
