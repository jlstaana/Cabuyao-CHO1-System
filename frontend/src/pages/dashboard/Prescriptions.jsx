import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { FileText, Download, User } from 'lucide-react';
import SEO from '../../components/SEO';

export default function Prescriptions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await api.get('/prescriptions');
        setPrescriptions(response.data);
      } catch (err) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="E-Prescriptions" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-Prescriptions</h1>
          <p className="text-slate-500">Access and manage digitally signed medical prescriptions.</p>
        </div>
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
        ) : prescriptions.length === 0 ? (
           <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">No prescriptions found.</div>
        ) : prescriptions.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                {p.notes || 'Prescription Details'}
              </h3>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
            </div>
            
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-sm flex items-center gap-2 text-slate-600">
                <User size={16} className="text-slate-400" /> Patient: {p.patient?.user?.name || 'Unknown Patient'}
              </p>
              <p className="text-sm flex items-center gap-2 text-slate-600">
                <User size={16} className="text-slate-400" /> Prescribed By: Dr. {p.doctor?.user?.name || 'Unknown Doctor'}
              </p>
            </div>
            
            <button 
              onClick={() => window.open(\`http://127.0.0.1:8000/api/prescriptions/\${p.id}/download\`, '_blank')}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-slate-200 hover:border-emerald-200"
            >
              <Download size={18} /> Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
