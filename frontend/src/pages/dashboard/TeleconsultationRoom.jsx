import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import SEO from '../../components/SEO';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Upload, Activity, FileText, Pill, Plus, CheckCircle, Wifi, MessageCircle, Send, PenLine, Eraser } from 'lucide-react';
import toast from 'react-hot-toast';

const VIDEO_QUALITY_PROFILES = {
  high: {
    label: 'High',
    constraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  },
  standard: {
    label: 'Standard',
    constraints: {
      width: { ideal: 960 },
      height: { ideal: 540 },
      frameRate: { ideal: 24, max: 30 },
    },
  },
  low: {
    label: 'Low',
    constraints: {
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 15, max: 20 },
    },
  },
};

function getAdaptiveVideoQuality() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
    return 'low';
  }

  if (connection?.effectiveType === '3g' || window.innerWidth < 768) {
    return 'standard';
  }

  return 'high';
}

function getAdaptiveNoiseThreshold() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
    return 0.045;
  }

  if (connection?.effectiveType === '3g' || window.innerWidth < 768) {
    return 0.035;
  }

  return 0.025;
}

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
  const [videoQuality, setVideoQuality] = useState(getAdaptiveVideoQuality);
  const [noiseCancellationActive, setNoiseCancellationActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  
  // Vitals State
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '' });
  
  // Doctor Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseGateFrameRef = useRef(null);
  const chatListRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const signatureStrokesRef = useRef([]);

  const stopAudioProcessing = useCallback(() => {
    if (noiseGateFrameRef.current) {
      cancelAnimationFrame(noiseGateFrameRef.current);
      noiseGateFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setNoiseCancellationActive(false);
  }, []);

  const enhanceAudioStream = useCallback((stream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !window.AudioContext) {
      setNoiseCancellationActive(Boolean(audioTrack));
      return stream;
    }

    stopAudioProcessing();

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioContext.createAnalyser();
      const compressor = audioContext.createDynamicsCompressor();
      const gate = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();
      const samples = new Uint8Array(analyser.fftSize);

      analyser.fftSize = 512;
      compressor.threshold.value = -45;
      compressor.knee.value = 24;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.18;

      source.connect(analyser);
      source.connect(compressor);
      compressor.connect(gate);
      gate.connect(destination);

      const updateGate = () => {
        analyser.getByteTimeDomainData(samples);
        let total = 0;

        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          total += normalized * normalized;
        }

        const rms = Math.sqrt(total / samples.length);
        const targetGain = rms < getAdaptiveNoiseThreshold() ? 0.08 : 1;
        gate.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.08);
        noiseGateFrameRef.current = requestAnimationFrame(updateGate);
      };

      updateGate();
      audioContextRef.current = audioContext;
      setNoiseCancellationActive(true);

      return new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
    } catch {
      setNoiseCancellationActive(Boolean(audioTrack));
      return stream;
    }
  }, [stopAudioProcessing]);

  const applyVideoQuality = useCallback(async (quality) => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    const fallbackOrder = quality === 'high'
      ? ['high', 'standard', 'low']
      : quality === 'standard'
        ? ['standard', 'low']
        : ['low'];

    for (const nextQuality of fallbackOrder) {
      try {
        await videoTrack.applyConstraints(VIDEO_QUALITY_PROFILES[nextQuality].constraints);
        setVideoQuality(nextQuality);
        return;
      } catch {
        // Try the next lower profile when a camera cannot satisfy the requested constraints.
      }
    }
  }, []);

  useEffect(() => {
    // Fetch consultation details
    const fetchDetails = async () => {
      try {
        // Fetch specific consultation from the index list (simple workaround since no specific GET /id is set)
        const res = await api.get('/consultations');
        const current = res.data.find(c => c.id === parseInt(id));
        if (current) setConsultation(current);
      } catch {
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
      stopAudioProcessing();
    };
  }, [id, stopAudioProcessing, user]);

  useEffect(() => {
    let active = true;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/consultations/${id}/messages`);
        if (active) setChatMessages(res.data || []);
      } catch {
        // Chat polling is intentionally quiet so the room is not interrupted.
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    const chatList = chatListRef.current;
    if (!chatList) return;
    chatList.scrollTop = chatList.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (!callActive) return;

    const adaptQuality = () => {
      applyVideoQuality(getAdaptiveVideoQuality());
    };
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    connection?.addEventListener?.('change', adaptQuality);
    window.addEventListener('resize', adaptQuality);

    return () => {
      connection?.removeEventListener?.('change', adaptQuality);
      window.removeEventListener('resize', adaptQuality);
    };
  }, [applyVideoQuality, callActive]);

  const toggleCall = async () => {
    if (!callActive) {
      try {
        const initialQuality = getAdaptiveVideoQuality();
        let stream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_QUALITY_PROFILES[initialQuality].constraints,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setVideoQuality(initialQuality);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_QUALITY_PROFILES.low.constraints,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setVideoQuality('low');
        }

        stream = enhanceAudioStream(stream);
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
      stopAudioProcessing();
      setCallActive(false);
      navigate('/consultations');
      toast('Call ended');
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
    } catch {
      toast.error('Failed to save vitals');
    }
  };

  const getSignaturePoint = (event) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startSignature = (event) => {
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getSignaturePoint(event);
    signatureDrawingRef.current = true;
    signatureStrokesRef.current.push([point]);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const drawSignature = (event) => {
    if (!signatureDrawingRef.current) return;
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getSignaturePoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    signatureStrokesRef.current[signatureStrokesRef.current.length - 1]?.push(point);
    setHasSignature(true);
  };

  const stopSignature = () => {
    signatureDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureStrokesRef.current = [];
    setHasSignature(false);
  };

  const buildSignatureSvg = () => {
    const strokes = signatureStrokesRef.current.filter((stroke) => stroke.length > 1);
    const points = strokes.flat();
    if (points.length === 0) return '';

    const minX = Math.max(0, Math.min(...points.map((point) => point.x)) - 18);
    const minY = Math.max(0, Math.min(...points.map((point) => point.y)) - 18);
    const maxX = Math.min(720, Math.max(...points.map((point) => point.x)) + 18);
    const maxY = Math.min(220, Math.max(...points.map((point) => point.y)) + 18);
    const viewBoxWidth = Math.max(80, maxX - minX);
    const viewBoxHeight = Math.max(34, maxY - minY);

    const paths = strokes
      .map((stroke) => {
        const [first, ...rest] = stroke;
        const pathData = [
          `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`,
          ...rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`),
        ].join(' ');
        return `<path d="${pathData}" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${viewBoxWidth.toFixed(1)} ${viewBoxHeight.toFixed(1)}" width="36" height="10" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
  };

  const completeConsultation = async (e) => {
    e.preventDefault();
    if (prescriptionItems.length > 0 && !hasSignature) {
      toast.error('Please add your e-signature before generating the e-prescription.');
      return;
    }

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
          doctor_signature_svg: buildSignatureSvg(),
          items: prescriptionItems
        });
        toast.success('E-Prescription generated officially!');
      }

      toast.success('Consultation marked as Completed!');
      navigate('/consultations');
    } catch {
      toast.error('Error completing consultation');
    }
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medicine_id: '', dosage: '', frequency: '' }]);
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    const message = chatMessage.trim();
    if (!message) return;

    setChatSending(true);
    try {
      const res = await api.post(`/consultations/${id}/messages`, { message });
      setChatMessages((current) => [...current, res.data]);
      setChatMessage('');
    } catch {
      toast.error('Failed to send chat message');
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      <SEO title="Live Teleconsultation" />
      
      {/* Video Call Area */}
      <div data-tour="page-video" className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl dark:shadow-none flex flex-col border border-slate-800">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
               <span className="w-2 h-2 bg-surface rounded-full"></span> LIVE
            </span>
            <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
               {consultation ? (user.role === 'Patient' ? `Consulting Dr. ${consultation?.doctor?.user?.name || 'Assigned Doctor'}` : `Patient: ${consultation?.patient?.user?.name}`) : 'Loading...'}
            </span>
            {callActive && (
              <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Wifi size={12} /> Auto {VIDEO_QUALITY_PROFILES[videoQuality].label}
              </span>
            )}
            {callActive && noiseCancellationActive && (
              <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Mic size={12} /> Noise Cancel
              </span>
            )}
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-slate-800 relative overflow-hidden">
           {!callActive ? (
             <button data-tour="page-primary-action" onClick={toggleCall} className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold shadow-lg dark:shadow-none shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-105 flex items-center gap-3">
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
               {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-zinc-500">Camera Disabled</div>}
               
               <div className="absolute bottom-6 right-6 w-32 h-48 bg-slate-700 rounded-2xl border-2 border-white/20 shadow-2xl dark:shadow-none overflow-hidden flex items-center justify-center">
                  <span className="text-xs text-white/50 px-3 text-center">Remote video connects through the telehealth service</span>
               </div>
             </>
           )}
        </div>

        {/* Call Controls */}
        <div data-tour="page-actions" className="h-20 bg-slate-950 flex items-center justify-center gap-4 px-6 z-10 relative">
           <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/30'}`}>
             {micActive ? <Mic size={20} /> : <MicOff size={20} />}
           </button>
           <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/30'}`}>
             {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
           </button>
           <button onClick={toggleCall} className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg dark:shadow-none shadow-rose-500/20"><PhoneOff size={24} /></button>
        </div>
      </div>

      {/* Right Sidebar panels */}
      <div className="w-full md:w-[28rem] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
         
         {/* Patient Context & Vitals */}
         <div data-tour="page-form" className="bg-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 shrink-0">
            <h3 className="font-semibold text-text flex items-center gap-2 mb-4"><Activity size={18} className="text-sky-500"/> Vital Signs</h3>
            {user.role === 'Patient' ? (
               <form className="space-y-3" onSubmit={saveVitals}>
                  <input value={vitals.blood_pressure} onChange={e=>setVitals({...vitals, blood_pressure: e.target.value})} placeholder="Blood Pressure (e.g. 120/80)" className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <input value={vitals.heart_rate} onChange={e=>setVitals({...vitals, heart_rate: e.target.value})} placeholder="Heart Rate (bpm)" className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <input value={vitals.temperature} onChange={e=>setVitals({...vitals, temperature: e.target.value})} placeholder="Temperature (°C)" className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none" required/>
                  <button type="submit" className="w-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-medium py-2 rounded-xl hover:bg-sky-100 dark:bg-sky-900/50 transition-colors text-sm">Submit Live Vitals</button>
               </form>
            ) : (
               <div className="space-y-2 text-sm">
                  {consultation?.vital_signs ? (
                    <>
                      <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 dark:text-zinc-500">BP</span><span className="font-medium">{consultation.vital_signs.blood_pressure}</span></div>
                      <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500 dark:text-zinc-500">Heart Rate</span><span className="font-medium">{consultation.vital_signs.heart_rate} bpm</span></div>
                      <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-zinc-500">Temperature</span><span className="font-medium">{consultation.vital_signs.temperature} °C</span></div>
                    </>
                  ) : <p className="text-slate-400 dark:text-zinc-500 italic">Waiting for patient to submit vitals...</p>}
               </div>
            )}
         </div>

         {/* Session Chat */}
         <div data-tour="page-chat" className="bg-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 shrink-0">
            <h3 className="font-semibold text-text flex items-center gap-2 mb-4"><MessageCircle size={18} className="text-teal-500"/> Session Chat</h3>
            <div ref={chatListRef} className="h-56 overflow-y-auto rounded-xl border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 bg-background p-3 space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-16">No messages yet.</p>
              ) : chatMessages.map((message) => {
                const isMine = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-teal-500 text-white rounded-br-md' : 'bg-surface text-slate-700 border border-slate-300 dark:border-zinc-800 rounded-bl-md'}`}>
                      <div className={`mb-1 text-[10px] font-semibold ${isMine ? 'text-teal-50' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {isMine ? 'You' : message.sender?.name || 'Participant'}
                      </div>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                      <div className={`mt-1 text-[10px] ${isMine ? 'text-teal-50' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={sendChatMessage} className="mt-3 flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-w-0 flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                maxLength={1000}
              />
              <button type="submit" disabled={chatSending || !chatMessage.trim()} className="w-11 h-11 rounded-xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Send size={17} />
              </button>
            </form>
         </div>

         {/* Medical Images */}
         <div data-tour="page-list" className="bg-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 shrink-0">
            <h3 className="font-semibold text-text flex items-center gap-2 mb-4"><Upload size={18} className="text-indigo-500"/> Medical Images</h3>
            {user.role === 'Patient' && (
               <div className="border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-background transition-colors cursor-pointer mb-4" onClick={() => navigate('/medical-images')}>
                  <Upload size={24} className="mx-auto text-slate-400 dark:text-zinc-500 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-zinc-500">Click to upload lab results or imaging</p>
               </div>
            )}
            <div className="flex gap-2 text-sm text-slate-500 dark:text-zinc-500">
               No images uploaded for this session.
            </div>
         </div>

         {/* Doctor's Consultation & E-Prescription Form */}
         {user.role === 'Doctor' && (
            <div data-tour="page-prescription" className="bg-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800 flex-1 flex flex-col">
               <h3 className="font-semibold text-text flex items-center gap-2 mb-4"><FileText size={18} className="text-emerald-500"/> Clinical Diagnosis & E-Prescription</h3>
               
               <form className="space-y-4 flex-1 flex flex-col" onSubmit={completeConsultation}>
                  {/* Diagnosis */}
                  <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Observed symptoms..." className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0" required />
                  <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Official Diagnosis..." className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0" required />
                  
                  {/* E-Prescription Builder */}
                  <div className="border border-slate-300 dark:border-zinc-800 rounded-xl p-3 bg-background flex-1 overflow-y-auto">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Pill size={14}/> Prescribe Medicines</span>
                        <button type="button" onClick={addPrescriptionItem} className="text-xs bg-emerald-100 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center"><Plus size={12}/> Add</button>
                     </div>
                     
                     <div className="space-y-3">
                       {prescriptionItems.length === 0 && <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-2">No medicines prescribed yet.</p>}
                       {prescriptionItems.map((item, idx) => (
                         <div key={idx} className="bg-surface p-2 rounded-lg border border-slate-300 dark:border-zinc-800 space-y-2">
                            <select 
                              className="w-full text-sm p-1.5 border border-slate-300 dark:border-zinc-800 rounded bg-background"
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
                                 <option key={m.id} value={m.id}>{m.name}</option>
                               ))}
                            </select>
                            <div className="flex gap-2">
                               <input placeholder="Dosage (e.g. 1 Tablet)" value={item.dosage} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].dosage = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-slate-300 dark:border-zinc-800 rounded" required/>
                               <input placeholder="Frequency (e.g. 3x a day)" value={item.frequency} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].frequency = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-slate-300 dark:border-zinc-800 rounded" required/>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  {prescriptionItems.length > 0 && (
                    <div className="border border-slate-300 dark:border-zinc-800 rounded-xl bg-surface p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><PenLine size={14}/> Doctor E-Signature</span>
                        <button type="button" onClick={clearSignature} className="text-xs bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded hover:bg-slate-200 dark:bg-zinc-800 font-bold flex items-center gap-1">
                          <Eraser size={12}/> Clear
                        </button>
                      </div>
                      <div className="mx-auto w-full max-w-[24rem]">
                        <canvas
                          ref={signatureCanvasRef}
                          width={720}
                          height={220}
                          onMouseDown={startSignature}
                          onMouseMove={drawSignature}
                          onMouseUp={stopSignature}
                          onMouseLeave={stopSignature}
                          onTouchStart={startSignature}
                          onTouchMove={drawSignature}
                          onTouchEnd={stopSignature}
                          className="mx-auto h-32 w-full rounded-xl bg-background cursor-crosshair touch-none border border-slate-300 dark:border-zinc-800 dark:border-zinc-800"
                        />
                        <div className="mx-auto mt-2 w-2/3 border-t border-slate-300" />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors text-sm shadow-lg dark:shadow-none shadow-emerald-500/30 mt-4 shrink-0 flex items-center justify-center gap-2">
                     <CheckCircle size={18} /> Finalize & Generate PDF
                  </button>
               </form>
            </div>
         )}
      </div>
    </div>
  );
}
