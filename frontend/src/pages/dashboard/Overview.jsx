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
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
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
