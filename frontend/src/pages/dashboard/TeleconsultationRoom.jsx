import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import SEO from '../../components/SEO';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Upload, Activity, FileText, Pill, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeleconsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [callActive, setCallActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  
  // Vitals State
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '' });
  
  // Doctor Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Fetch consultation details
    const fetchDetails = async () => {
      try {
        // Fetch specific consultation from the index list (simple workaround since no specific GET /id is set)
        const res = await api.get('/consultations');
        const current = res.data.find(c => c.id === parseInt(id));
        if (current) setConsultation(current);
      } catch (err) {
        toast.error("Could not load consultation context");
      }
    };
    fetchDetails();

    // Fetch medicines for e-prescribing
    if (user?.role === 'Doctor') {
      api.get('/medicines').then(res => setMedicines(res.data)).catch(console.error);
    }

    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [id, user]);

  const toggleCall = async () => {
    if (!callActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setCallActive(true);
        // Delay attaching stream to allow video element to render
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        toast.error("Camera/Microphone access denied or not found.");
        console.error(err);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCallActive(false);
      navigate('/consultations');
      toast('Call ended', { icon: '👋' });
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    }
  };

  const saveVitals = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/consultations/${id}/vitals`, vitals);
      toast.success('Vitals recorded to database!');
    } catch (err) {
      toast.error('Failed to save vitals');
    }
  };

  const completeConsultation = async (e) => {
    e.preventDefault();
    try {
      // 1. Submit consultation notes
      await api.post(`/consultations/${id}/complete`, {
        symptoms, diagnosis, notes: 'Completed via Telehealth Room'
      });
      
      // 2. Submit E-Prescription if items exist
      if (prescriptionItems.length > 0) {
        await api.post('/prescriptions', {
          consultation_id: id,
          patient_id: consultation?.patient_id,
          notes: `Diagnosis: ${diagnosis}`,
          items: prescriptionItems
        });
        toast.success('E-Prescription generated officially!');
      }

      toast.success('Consultation marked as Completed!');
      navigate('/consultations');
    } catch (err) {
      toast.error('Error completing consultation');
    }
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medicine_id: '', dosage: '', frequency: '' }]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      <SEO title="Live Teleconsultation" />
      
      {/* Video Call Area */}
      <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col border border-slate-800">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
               <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
            <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
               {consultation ? (user.role === 'Patient' ? `Consulting Dr. ${consultation?.doctor?.user?.name || 'Assigned Doctor'}` : `Patient: ${consultation?.patient?.user?.name}`) : 'Loading...'}
            </span>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-slate-800 relative overflow-hidden">
           {!callActive ? (
             <button onClick={toggleCall} className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-105 flex items-center gap-3">
                <Video size={24} /> Start / Join Camera
             </button>
           ) : (
             <>
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                 style={{ transform: 'scaleX(-1)' }} // Mirror camera
               />
               {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-slate-500">Camera Disabled</div>}
               
               {/* PIP Local Camera Preview (Mocking the Remote User as main, Local as PIP) */}
               <div className="absolute bottom-6 right-6 w-32 h-48 bg-slate-700 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center">
                  <span className="text-xs text-white/50 z-10 absolute">Remote User</span>
                  <div className="w-full h-full bg-slate-600 animate-pulse"></div>
               </div>
             </>
           )}
        </div>

        {/* Call Controls */}
        <div className="h-20 bg-slate-950 flex items-center justify-center gap-4 px-6 z-10 relative">
           <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'}`}>
             {micActive ? <Mic size={20} /> : <MicOff size={20} />}
           </button>
           <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'}`}>
             {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
           </button>
           <button onClick={toggleCall} className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"><PhoneOff size={24} /></button>
        </div>
      </div>

      {/* Right Sidebar panels */}
      <div className="w-full md:w-[28rem] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
         
         {/* Patient Context & Vitals */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Activity size={18} className="text-sky-500"/> Vital Signs</h3>
            {user.role === 'Patient' ? (
               <form className="space-y-3" onSubmit={saveVitals}>
                  <input value={vitals.blood_pressure} onChange={e=>setVitals({...vitals, blood_pressure: e.target.value})} placeholder="Blood Pressure (e.g. 120/80)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <input value={vitals.heart_rate} onChange={e=>setVitals({...vitals, heart_rate: e.target.value})} placeholder="Heart Rate (bpm)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <input value={vitals.temperature} onChange={e=>setVitals({...vitals, temperature: e.target.value})} placeholder="Temperature (°C)" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <button type="submit" className="w-full bg-sky-50 text-sky-600 font-medium py-2 rounded-xl hover:bg-sky-100 transition-colors text-sm">Submit Live Vitals</button>
               </form>
            ) : (
               <div className="space-y-2 text-sm">
                  {consultation?.vital_signs?.length > 0 ? (
                    <>
                      <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">BP</span><span className="font-medium">{consultation.vital_signs[0].blood_pressure}</span></div>
                      <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Heart Rate</span><span className="font-medium">{consultation.vital_signs[0].heart_rate} bpm</span></div>
                      <div className="flex justify-between pb-2"><span className="text-slate-500">Temperature</span><span className="font-medium">{consultation.vital_signs[0].temperature} °C</span></div>
                    </>
                  ) : <p className="text-slate-400 italic">Waiting for patient to submit vitals...</p>}
               </div>
            )}
         </div>

         {/* Medical Images */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Upload size={18} className="text-indigo-500"/> Medical Images</h3>
            {user.role === 'Patient' && (
               <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer mb-4" onClick={() => toast.success('Image upload simulator triggered')}>
                  <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">Click to upload lab results or imaging</p>
               </div>
            )}
            <div className="flex gap-2 text-sm text-slate-500">
               No images uploaded for this session.
            </div>
         </div>

         {/* Doctor's Consultation & E-Prescription Form */}
         {user.role === 'Doctor' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-1 flex flex-col">
               <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><FileText size={18} className="text-emerald-500"/> Clinical Diagnosis & E-Prescription</h3>
               
               <form className="space-y-4 flex-1 flex flex-col" onSubmit={completeConsultation}>
                  {/* Diagnosis */}
                  <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Observed symptoms..." className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0" required />
                  <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Official Diagnosis..." className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0" required />
                  
                  {/* E-Prescription Builder */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex-1 overflow-y-auto">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Pill size={14}/> Prescribe Medicines</span>
                        <button type="button" onClick={addPrescriptionItem} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center"><Plus size={12}/> Add</button>
                     </div>
                     
                     <div className="space-y-3">
                       {prescriptionItems.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No medicines prescribed yet.</p>}
                       {prescriptionItems.map((item, idx) => (
                         <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 space-y-2">
                            <select 
                              className="w-full text-sm p-1.5 border border-slate-200 rounded bg-slate-50"
                              value={item.medicine_id}
                              onChange={e => {
                                const newItems = [...prescriptionItems];
                                newItems[idx].medicine_id = e.target.value;
                                setPrescriptionItems(newItems);
                              }}
                              required
                            >
                               <option value="">Select Medicine in Database...</option>
                               {medicines.map(m => (
                                 <option key={m.id} value={m.id}>{m.name} ({m.stock_quantity} in stock)</option>
                               ))}
                            </select>
                            <div className="flex gap-2">
                               <input placeholder="Dosage (e.g. 1 Tablet)" value={item.dosage} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].dosage = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-slate-200 rounded" required/>
                               <input placeholder="Frequency (e.g. 3x a day)" value={item.frequency} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].frequency = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-slate-200 rounded" required/>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors text-sm shadow-lg shadow-emerald-500/30 mt-4 shrink-0 flex items-center justify-center gap-2">
                     <CheckCircle size={18} /> Finalize & Generate PDF
                  </button>
               </form>
            </div>
         )}
      </div>
    </div>
  );
}
