import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import { BarChart, Activity, Download, List } from 'lucide-react';

export default function Analytics() {
  const { user } = useAuthStore();
  
  if (user?.role !== 'Admin') {
    return <div className="p-8 text-center text-slate-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <SEO title="Analytics & Reports" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Analytics & Logs</h1>
          <p className="text-slate-500">Generate descriptive analytics reports and monitor activity.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-medium">
          <Download size={18} /> Export Full Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-6"><BarChart size={18} className="text-sky-500"/> Consultation Statistics</h3>
            <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <Activity size={32} className="mb-2 opacity-50"/>
               <p>Recharts Analytics Chart renders here</p>
               <p className="text-xs">Based on GET /api/analytics/stats</p>
            </div>
         </div>

         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-6"><BarChart size={18} className="text-emerald-500"/> E-Prescription Trends</h3>
            <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
               <p>Top 10 Prescribed Medicines (Bar Chart)</p>
            </div>
         </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
         <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><List size={18} className="text-indigo-500"/> Recent System Activity Logs</h3>
         <div className="space-y-3">
            {[
              {action: 'Admin Generated Doctor Account', time: '10 mins ago', ip: '192.168.1.5'},
              {action: 'Dr. Jane completed Consultation #104', time: '1 hour ago', ip: '10.0.0.45'},
              {action: 'Patient registered new account', time: '2 hours ago', ip: '112.204.x.x'},
            ].map((log, i) => (
               <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div>
                     <p className="font-medium text-slate-800 text-sm">{log.action}</p>
                     <p className="text-xs text-slate-500 mt-0.5">IP: {log.ip}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{log.time}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
