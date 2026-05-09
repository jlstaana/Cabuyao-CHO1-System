import { useState } from 'react';
import { Link } from 'react-router-dom';
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                {c.status}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-slate-600"><Calendar size={16} className="text-slate-400" /> {c.date}</p>
              <p className="text-sm flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400" /> {c.time}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {c.status === 'Scheduled' && (
                <Link to={\`/room/\${c.id}\`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                  <Video size={18} /> Join Call
                </Link>
              )}
              {c.status === 'Completed' && user?.role === 'Doctor' && (
                <Link to={\`/room/\${c.id}\`} className="flex-1 flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-2 rounded-lg font-medium hover:bg-sky-100 transition-colors">
                  <FilePlus size={18} /> E-Prescribe
                </Link>
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
