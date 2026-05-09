
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { Video, FilePlus, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function Consultations() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await api.get('/consultations');
        setConsultations(res.data);
      } catch (err) {
        toast.error('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

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
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-48 mb-6" />
                <Skeleton className="h-10 w-full" />
             </div>
           ))
        ) : consultations.length === 0 ? (
           <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">No consultations found.</div>
        ) : consultations.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900">{c.patient?.user?.name || 'Unknown Patient'}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                {c.status}
              </span>
            </div>
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-slate-600"><Calendar size={16} className="text-slate-400" /> {new Date(c.created_at).toLocaleDateString()}</p>
              {c.scheduled_at && <p className="text-sm flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400" /> {new Date(c.scheduled_at).toLocaleTimeString()}</p>}
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {c.status === 'Scheduled' && (
                <Link to={`/room/${c.id}`} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                  <Video size={18} /> Join Call
                </Link>
              )}
              {c.status === 'Completed' && user?.role === 'Doctor' && (
                <Link to={`/room/${c.id}`} className="flex-1 flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-2 rounded-lg font-medium hover:bg-sky-100 transition-colors">
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
