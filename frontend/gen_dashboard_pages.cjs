const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n');
}

// 1. Profile Page (Patient / Doctor Availability)
write('src/pages/dashboard/Profile.jsx', `
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import { User, Shield, Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Profile Settings" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Profile</h1>
        <p className="text-slate-500">Manage your personal information and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold text-3xl mb-4 shadow-inner">
                 {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500 mb-4">{user.email}</p>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{user.role}</span>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><User size={20} className="text-sky-500"/> Personal Details</h3>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input defaultValue={user.name} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input defaultValue={user.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                    </div>
                 </div>
                 
                 {user.role === 'Patient' && (
                   <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                        <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" rows="3"></textarea>
                    </div>
                   </>
                 )}

                 {user.role === 'Doctor' && (
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock size={16}/> Availability Schedule</label>
                      <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. Mon-Fri, 9AM - 5PM" />
                   </div>
                 )}

                 <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-sky-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200 disabled:opacity-70">
                       {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}
`);

// 2. Teleconsultation Room (Conduct/Join Call, Vitals, Images, Complete Form)
write('src/pages/dashboard/TeleconsultationRoom.jsx', `
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Upload, Activity, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeleconsultationRoom() {
  const { user } = useAuthStore();
  const [callActive, setCallActive] = useState(false);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      <SEO title="Teleconsultation Room" />
      
      {/* Video Call Area */}
      <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col border border-slate-800">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
               <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
            <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
               {user.role === 'Patient' ? 'Consulting Dr. Smith' : 'Patient: Juan Dela Cruz'}
            </span>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-slate-800 relative">
           {!callActive ? (
             <button onClick={() => setCallActive(true)} className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-105 flex items-center gap-3">
                <Video size={24} /> Join Consultation Call
             </button>
           ) : (
             <div className="w-full h-full object-cover bg-slate-700 flex items-center justify-center text-slate-500">
               Video Stream Placeholder
             </div>
           )}
           
           {callActive && (
              <div className="absolute bottom-6 right-6 w-32 h-48 bg-slate-600 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center">
                 <span className="text-xs text-white/50">Your Camera</span>
              </div>
           )}
        </div>

        {/* Call Controls */}
        <div className="h-20 bg-slate-950 flex items-center justify-center gap-4 px-6">
           <button className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"><Mic size={20} /></button>
           <button className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"><Video size={20} /></button>
           <button onClick={() => {setCallActive(false); toast('Call ended');}} className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"><PhoneOff size={24} /></button>
        </div>
      </div>

      {/* Right Sidebar panels */}
      <div className="w-full md:w-96 flex flex-col gap-4 overflow-y-auto pr-2">
         {/* Patient Context & Vitals */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Activity size={18} className="text-sky-500"/> Vital Signs</h3>
            {user.role === 'Patient' ? (
               <form className="space-y-3" onSubmit={(e) => {e.preventDefault(); toast.success('Vitals recorded!');}}>
                  <input placeholder="Blood Pressure (e.g. 120/80)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" />
                  <input placeholder="Heart Rate (bpm)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" />
                  <input placeholder="Temperature (°C)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" />
                  <button type="submit" className="w-full bg-sky-50 text-sky-600 font-medium py-2 rounded-xl hover:bg-sky-100 transition-colors text-sm">Save Vitals</button>
               </form>
            ) : (
               <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">BP</span><span className="font-medium">120/80</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Heart Rate</span><span className="font-medium">75 bpm</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-500">Temperature</span><span className="font-medium">36.8 °C</span></div>
               </div>
            )}
         </div>

         {/* Medical Images */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Upload size={18} className="text-indigo-500"/> Medical Images</h3>
            {user.role === 'Patient' && (
               <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer mb-4" onClick={() => toast.success('Image uploaded!')}>
                  <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">Click to upload lab results or imaging (.jpg, .pdf)</p>
               </div>
            )}
            <div className="flex gap-2">
               <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-slate-200">X-Ray</div>
               <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-slate-200">CBC</div>
            </div>
         </div>

         {/* Doctor's Consultation Form */}
         {user.role === 'Doctor' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-1 flex flex-col">
               <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><FileText size={18} className="text-emerald-500"/> Consultation Notes</h3>
               <form className="space-y-3 flex-1 flex flex-col" onSubmit={(e) => {e.preventDefault(); toast.success('Consultation marked as Completed!');}}>
                  <textarea placeholder="Symptoms described by patient..." className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-20" />
                  <textarea placeholder="Doctor's Diagnosis..." className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none flex-1" />
                  <button type="submit" className="w-full bg-emerald-500 text-white font-medium py-2.5 rounded-xl hover:bg-emerald-600 transition-colors text-sm shadow-md shadow-emerald-200 mt-auto">Complete Consultation</button>
               </form>
            </div>
         )}
      </div>
    </div>
  );
}
`);

// 3. Medicines Database Page
write('src/pages/dashboard/Medicines.jsx', `
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import Modal from '../../components/Modal';
import { Pill, Plus, Search, Archive } from 'lucide-react';

export default function Medicines() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const mockMedicines = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Analgesic', stock: 1500, active: true },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 800, active: true },
    { id: 3, name: 'Loratadine 10mg', category: 'Antihistamine', stock: 450, active: true },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Medicine Database" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Database</h1>
          <p className="text-slate-500">View and manage the inventory of available medicines.</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Staff') && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm font-medium">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search medicines..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white" />
           </div>
         </div>
         <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
              <th className="p-4 font-semibold">Medicine Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Stock Level</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {mockMedicines.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 flex items-center gap-3 font-medium text-slate-900">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Pill size={16}/></div>
                   {m.name}
                </td>
                <td className="p-4 text-slate-500">{m.category}</td>
                <td className="p-4">
                   <span className={\`px-2.5 py-1 rounded-md text-xs font-bold \${m.stock > 500 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{m.stock} Units</span>
                </td>
                <td className="p-4 text-right">
                   {(user?.role === 'Admin' || user?.role === 'Staff') ? (
                     <>
                        <button className="text-sky-600 hover:text-sky-800 text-sm font-semibold mr-3">Edit</button>
                        <button className="text-rose-500 hover:text-rose-700 text-sm font-semibold"><Archive size={16} className="inline mr-1" />Deactivate</button>
                     </>
                   ) : (
                     <span className="text-slate-400 text-sm">View Only</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Medicine">
        <form className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Generic / Brand Name</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white">
                 <option>Antibiotic</option>
                 <option>Analgesic</option>
                 <option>Vitamins</option>
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
              <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
           </div>
           <div className="pt-4 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium">Cancel</button>
              <button type="button" className="px-5 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md">Save Medicine</button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
`);

// 4. Analytics & Logs Dashboard
write('src/pages/dashboard/Analytics.jsx', `
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
`);
