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
