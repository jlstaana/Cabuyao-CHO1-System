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
