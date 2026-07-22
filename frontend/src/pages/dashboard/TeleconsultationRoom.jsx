import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Activity, FileText, Pill, 
  Plus, CheckCircle, Wifi, MessageCircle, Send, PenLine, Eraser, 
  Sparkles, MonitorUp, Sliders, X, Clock, LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';

const VIDEO_QUALITY_PROFILES = {
  high: {
    label: 'High',
    constraints: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
  },
  standard: {
    label: 'Standard',
    constraints: { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 24, max: 30 } },
  },
  low: {
    label: 'Low',
    constraints: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15, max: 20 } },
  },
};

const BACKGROUND_PRESETS = [
  { id: 'none', label: 'None (Normal Camera)', icon: '🚫', type: 'none' },
  { id: 'blur-slight', label: 'Slight Blur', icon: '🌫️', type: 'blur', blurAmount: 'blur(6px)' },
  { id: 'blur-deep', label: 'Deep Blur', icon: '🌀', type: 'blur', blurAmount: 'blur(16px)' },
  {
    id: 'clinic',
    label: 'Modern Medical Studio',
    icon: '🏥',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'bookshelf',
    label: 'Medical Library',
    icon: '📚',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'office',
    label: 'Executive Consultation Office',
    icon: '🏙️',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'nature',
    label: 'Calm Botanical Garden',
    icon: '🌿',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop',
  },
];

function getAdaptiveVideoQuality() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return 'low';
  if (connection?.effectiveType === '3g' || window.innerWidth < 768) return 'standard';
  return 'high';
}

function getAdaptiveNoiseThreshold() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return 0.045;
  if (connection?.effectiveType === '3g' || window.innerWidth < 768) return 0.035;
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
  
  // Google Meet Features & Backgrounds
  const [bgPresetId, setBgPresetId] = useState('none');
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState('chat'); // 'chat' | 'clinical' | 'none'
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC State
  const [remoteStream, setRemoteStream] = useState(null);
  const pcRef = useRef(null);
  const processedSignals = useRef(new Set());
  const iceCandidateQueue = useRef([]);
  const remoteVideoRef = useRef(null);
  const [medicines, setMedicines] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
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
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseGateFrameRef = useRef(null);
  const chatListRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const signatureStrokesRef = useRef([]);

  const bgPreset = BACKGROUND_PRESETS.find((b) => b.id === bgPresetId) || BACKGROUND_PRESETS[0];

  useEffect(() => {
    if (!callActive) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  // Real-time HTML5 Canvas Video Processor for Background Blur & Virtual Environments
  useEffect(() => {
    if (!callActive || !cameraActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    let bgImg = null;

    if (bgPreset.type === 'image' && bgPreset.url) {
      bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = bgPreset.url;
    }

    const renderFrame = () => {
      if (video && video.readyState >= 2) {
        const width = canvas.width || 640;
        const height = canvas.height || 480;

        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Virtual Background Image FIRST (Background Layer)
        if (bgPreset.type === 'image' && bgImg && bgImg.complete) {
          ctx.drawImage(bgImg, 0, 0, width, height);
          ctx.globalAlpha = 0.88;
        }

        // 2. Apply Blur Filter if selected
        if (bgPreset.type === 'blur') {
          ctx.filter = bgPreset.blurAmount || 'blur(12px)';
        } else {
          ctx.filter = 'none';
        }

        // 3. Draw Mirrored Camera Video Frame ON TOP (Foreground Layer)
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [callActive, cameraActive, bgPreset]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const sendSignal = useCallback(async (payload) => {
    try {
      await api.post(`/consultations/${id}/messages`, {
        message: `[WEBRTC_SIGNAL]${JSON.stringify(payload)}`
      });
    } catch (err) {
      console.error('Failed to send signal', err);
    }
  }, [id]);

  const processWebRTCSignal = useCallback(async (signal) => {
    if (!pcRef.current) return false;
    try {
      if (signal.type === 'offer' || signal.type === 'answer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.offer || signal.answer));
        if (signal.type === 'offer') {
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          sendSignal({ type: 'answer', answer });
        }
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }
      } else if (signal.type === 'candidate') {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          iceCandidateQueue.current.push(signal.candidate);
        }
      }
    } catch (err) {
      console.error("WebRTC Error:", err);
    }
    return true;
  }, [sendSignal]);

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
        // Try lower profile fallback
      }
    }
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get('/consultations');
        const current = res.data.find(c => c.id === parseInt(id));
        if (current) {
          setConsultation(current);
          if (user?.role === 'Doctor' && current.patient_id) {
             api.get(`/patients/${current.patient_id}/prescriptions`)
               .then(pRes => setPastPrescriptions(pRes.data || []))
               .catch(() => {});
          }
        }
      } catch {
        toast.error("Could not load consultation context");
      }
    };
    fetchDetails();

    if (user?.role === 'Doctor') {
      api.get('/medicines').then(res => setMedicines(res.data)).catch(console.error);
    }

    return () => {
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
        const allMsgs = res.data || [];
        const chatMsgs = [];
        
        for (const msg of allMsgs) {
          if (msg.message.startsWith('[WEBRTC_SIGNAL]')) {
            const signalStr = msg.message.replace('[WEBRTC_SIGNAL]', '');
            if (!processedSignals.current.has(msg.id) && msg.sender_id !== user?.id) {
              const success = await processWebRTCSignal(JSON.parse(signalStr));
              if (success) {
                processedSignals.current.add(msg.id);
              }
            }
          } else {
            chatMsgs.push(msg);
          }
        }
        
        if (active) setChatMessages(chatMsgs);
      } catch {
        // Quiet chat polling
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, processWebRTCSignal, user?.id]);

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
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ type: 'candidate', candidate: event.candidate });
          }
        };

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pcRef.current = pc;

        if (user.role === 'Patient') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'offer', offer });
        }
      } catch (err) {
        toast.error("Camera/Microphone access denied or not found.");
        console.error(err);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopAudioProcessing();

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      iceCandidateQueue.current = [];
      processedSignals.current.clear();

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

  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_QUALITY_PROFILES[videoQuality].constraints,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        const enhanced = enhanceAudioStream(camStream);
        streamRef.current = enhanced;
        if (videoRef.current) videoRef.current.srcObject = enhanced;
        setIsSharingScreen(false);
        toast.success('Switched back to camera');
      } catch {
        toast.error('Failed to restore camera stream');
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streamRef.current = screenStream;
        if (videoRef.current) videoRef.current.srcObject = screenStream;
        setIsSharingScreen(true);
        toast.success('Sharing screen');
        screenStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
        };
      } catch {
        // User cancelled screen share picker
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
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startSignature = (event) => {
    event.preventDefault();
    signatureDrawingRef.current = true;
    const point = getSignaturePoint(event);
    signatureStrokesRef.current.push([point]);
    setHasSignature(true);
    redrawSignature();
  };

  const drawSignature = (event) => {
    if (!signatureDrawingRef.current) return;
    event.preventDefault();
    const point = getSignaturePoint(event);
    const strokes = signatureStrokesRef.current;
    if (strokes.length > 0) {
      strokes[strokes.length - 1].push(point);
      redrawSignature();
    }
  };

  const stopSignature = () => {
    signatureDrawingRef.current = false;
  };

  const clearSignature = () => {
    signatureStrokesRef.current = [];
    setHasSignature(false);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const redrawSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    signatureStrokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const buildSignatureSvg = () => {
    const strokes = signatureStrokesRef.current;
    if (!strokes.length) return '';
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
        return `<path d="${pathData}" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
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
      await api.post(`/consultations/${id}/complete`, {
        symptoms, diagnosis, notes: 'Completed via Google Meet Style Telehealth Room'
      });
      
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

  const copyPrescriptionItems = (items) => {
    const newItems = items.map(item => ({
      medicine_id: String(item.medicine_id),
      dosage: item.dosage || '',
      frequency: item.frequency || '',
    }));
    if (prescriptionItems.length === 1 && !prescriptionItems[0].medicine_id) {
      setPrescriptionItems(newItems);
    } else if (prescriptionItems.length === 0) {
      setPrescriptionItems(newItems);
    } else {
      setPrescriptionItems([...prescriptionItems, ...newItems]);
    }
    toast.success('Copied to current prescription list');
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

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callActive]);

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-7rem)] gap-4 animate-in fade-in duration-500 bg-slate-950 p-2 sm:p-4 rounded-3xl text-white">
      {/* ── Main Video Stage (Google Meet Widescreen) ─────────────────────────── */}
      <div data-tour="page-video" className="flex-1 min-h-[65vh] lg:min-h-0 bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col border border-slate-800">
        {/* Top Header Status Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
            <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider animate-pulse flex items-center gap-1.5 shadow-md shadow-rose-900/40">
              <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
            <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700/60 px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              {consultation ? (user.role === 'Patient' ? `Dr. ${consultation?.doctor?.user?.name || 'Assigned Doctor'}` : `Patient: ${consultation?.patient?.user?.name}`) : 'Loading...'}
            </span>
            {callActive && (
              <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Clock size={12} className="text-sky-400" /> {formatDuration(callDuration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {callActive && bgPreset.id !== 'none' && (
              <span className="bg-indigo-600/90 backdrop-blur-md text-white border border-indigo-500/50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                <Sparkles size={12} /> {bgPreset.label}
              </span>
            )}
            {callActive && (
              <span className="bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Wifi size={12} /> {VIDEO_QUALITY_PROFILES[videoQuality].label}
              </span>
            )}
          </div>
        </div>

        {/* Video Viewport Stage */}
        <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden">
          {!callActive ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20 shadow-inner">
                <Video size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to join consultation?</h2>
              <p className="text-slate-400 text-sm mb-6">
                Ensure your camera and microphone are connected before entering the meeting.
              </p>
              <button 
                data-tour="page-primary-action" 
                onClick={toggleCall} 
                className="bg-emerald-500 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-105 flex items-center gap-3 active:scale-95"
              >
                <Video size={22} /> Join Telehealth Call
              </button>
            </div>
          ) : (
            <>
              {/* Remote Video (Full Stage) */}
              {remoteStream ? (
                <video 
                  ref={remoteVideoRef}
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
                    <Video size={28} />
                  </div>
                  <p className="text-base font-semibold text-slate-200">Waiting for participant to join...</p>
                  <p className="text-xs text-slate-500 mt-1">The video stream will connect automatically as soon as both participants enter.</p>
                </div>
              )}

              {/* Local Video Canvas Processor (Picture-in-Picture) */}
              <div 
                className={`absolute bottom-6 right-6 w-36 sm:w-48 h-48 sm:h-64 rounded-2xl border-2 border-white/30 shadow-2xl overflow-hidden transition-all duration-300 z-20 bg-slate-950 ${cameraActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
                {/* Hidden raw video element receiving camera MediaStream */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="hidden" 
                />
                
                {/* Real-time Processed Canvas Video Display */}
                <canvas 
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="w-full h-full object-cover relative z-10"
                />
                
                {/* PIP Tag (z-20 Top Layer) */}
                <div className="absolute bottom-2 left-2 z-20 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/10">
                  You ({user.name.split(' ')[0]})
                </div>
              </div>

              {!cameraActive && (
                <div className="absolute bottom-6 right-6 w-36 sm:w-48 h-48 sm:h-64 bg-slate-900 rounded-2xl border-2 border-white/20 shadow-2xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-3">
                  <VideoOff size={24} className="mb-2 text-rose-400" />
                  <span>Camera Disabled</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Google Meet Floating Control Bar ───────────────────────────────── */}
        <div data-tour="page-actions" className="h-20 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between px-4 sm:px-8 z-30">
          <div className="hidden sm:flex items-center text-xs font-semibold text-slate-400 gap-2">
            <span>Cabuyao CHO Telehealth</span>
          </div>

          {/* Floating Pill Controls */}
          <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
            <button 
              onClick={toggleMic} 
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micActive ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}
            >
              {micActive ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button 
              onClick={toggleCamera} 
              title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}
            >
              {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Google Meet Backgrounds & Visual Effects Button */}
            <button 
              onClick={() => setIsBgModalOpen(true)} 
              title="Apply Visual Effects & Background Blur"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${bgPresetId !== 'none' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              <Sparkles size={20} />
            </button>

            {/* Screen Share Button */}
            <button 
              onClick={toggleScreenShare} 
              title={isSharingScreen ? 'Stop Presenting' : 'Present Screen'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSharingScreen ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              <MonitorUp size={20} />
            </button>

            {/* Side Drawer Toggles */}
            <button 
              onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')} 
              title="Toggle Live Chat"
              className={`w-12 h-12 rounded-full flex items-center justify-center relative transition-all ${activeSidePanel === 'chat' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              <MessageCircle size={20} />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-400 text-slate-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {chatMessages.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveSidePanel(activeSidePanel === 'clinical' ? 'none' : 'clinical')} 
              title="Toggle Vitals & E-Prescription Panel"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeSidePanel === 'clinical' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {user?.role === 'Doctor' ? <FileText size={20} /> : <Activity size={20} />}
            </button>

            {/* Leave Call Button */}
            <button 
              onClick={toggleCall} 
              title="End Call"
              className="w-14 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/30 active:scale-95 ml-2"
            >
              <PhoneOff size={22} />
            </button>
          </div>

          <div className="hidden sm:block"></div>
        </div>
      </div>

      {/* ── Side Drawer Panel (Chat / Vitals / E-Prescription) ──────────────────── */}
      {activeSidePanel !== 'none' && (
        <div className="w-full lg:w-[26rem] flex flex-col gap-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar shrink-0">
          
          {/* Chat Drawer */}
          {activeSidePanel === 'chat' && (
            <div data-tour="page-chat" className="bg-surface rounded-2xl p-5 shadow-sm border border-border flex-1 flex flex-col min-h-[22rem]">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                <h3 className="font-semibold text-text flex items-center gap-2">
                  <MessageCircle size={18} className="text-teal-500"/> In-Call Chat
                </h3>
                <button onClick={() => setActiveSidePanel('none')} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-background">
                  <X size={18} />
                </button>
              </div>

              <div ref={chatListRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-background p-3 space-y-3 custom-scrollbar min-h-[14rem]">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-text-light text-center py-16">No messages yet. Send a message to participants.</p>
                ) : chatMessages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${isMine ? 'bg-teal-500 text-white rounded-br-md' : 'bg-surface text-slate-700 border border-border rounded-bl-md'}`}>
                        <div className="text-[10px] opacity-75 font-semibold mb-0.5">{message.sender?.name || (isMine ? 'You' : 'User')}</div>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendChatMessage} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message to participants..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-text"
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatMessage.trim()}
                  className="bg-teal-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* Clinical / Vitals Drawer */}
          {activeSidePanel === 'clinical' && (
            <div data-tour="page-form" className="bg-surface rounded-2xl p-5 shadow-sm border border-border flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-semibold text-text flex items-center gap-2">
                  <Activity size={18} className="text-sky-500"/> Vital Signs & Consultation Form
                </h3>
                <button onClick={() => setActiveSidePanel('none')} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-background">
                  <X size={18} />
                </button>
              </div>

              {/* Vitals Form / Display */}
              <div className="space-y-3">
                {user.role === 'Patient' ? (
                  <form className="space-y-3" onSubmit={saveVitals}>
                    <input value={vitals.blood_pressure} onChange={e=>setVitals({...vitals, blood_pressure: e.target.value})} placeholder="Blood Pressure (e.g. 120/80)" className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-sky-500/20 outline-none text-text" />
                    <input value={vitals.heart_rate} onChange={e=>setVitals({...vitals, heart_rate: e.target.value})} placeholder="Heart Rate (bpm)" className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-sky-500/20 outline-none text-text" />
                    <input value={vitals.temperature} onChange={e=>setVitals({...vitals, temperature: e.target.value})} placeholder="Temperature (°C)" className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-sky-500/20 outline-none text-text" />
                    <button type="submit" className="w-full bg-primary-bg text-primary-text font-medium py-2 rounded-xl hover:bg-primary-hover transition-colors text-sm">Submit Live Vitals</button>
                  </form>
                ) : (
                  <div className="space-y-2 text-sm bg-background p-3 rounded-xl border border-border">
                    {consultation?.vital_signs ? (
                      <>
                        <div className="flex justify-between border-b border-border pb-1.5"><span className="text-text-muted">BP</span><span className="font-semibold text-text">{consultation.vital_signs.blood_pressure}</span></div>
                        <div className="flex justify-between border-b border-border pb-1.5"><span className="text-text-muted">Heart Rate</span><span className="font-semibold text-text">{consultation.vital_signs.heart_rate} bpm</span></div>
                        <div className="flex justify-between pb-1"><span className="text-text-muted">Temperature</span><span className="font-semibold text-text">{consultation.vital_signs.temperature} °C</span></div>
                      </>
                    ) : <p className="text-text-light italic text-xs">Waiting for patient to submit vitals...</p>}
                  </div>
                )}
              </div>

              {/* Doctor Form */}
              {user.role === 'Doctor' && (
                <form className="space-y-4 flex-1 flex flex-col" onSubmit={completeConsultation}>
                  <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Observed symptoms..." className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0 text-text" required />
                  <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Official Diagnosis..." className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0 text-text" required />
                  
                  <div className="border border-border rounded-xl p-3 bg-background flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Pill size={14}/> Prescribe Medicines</span>
                      <button type="button" onClick={addPrescriptionItem} className="text-xs bg-emerald-100 text-success-text px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center"><Plus size={12}/> Add</button>
                    </div>
                    
                    <div className="space-y-3">
                      {prescriptionItems.length === 0 && <p className="text-xs text-text-light text-center py-2">No medicines prescribed yet.</p>}
                      {prescriptionItems.map((item, idx) => (
                        <div key={idx} className="bg-surface p-2 rounded-lg border border-border space-y-2">
                          <select 
                            className="w-full text-sm p-1.5 border border-border rounded bg-background text-text"
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
                            <input placeholder="Dosage (e.g. 1 Tablet)" value={item.dosage} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].dosage = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-border rounded text-text" required/>
                            <input placeholder="Frequency (e.g. 3x a day)" value={item.frequency} onChange={e => { const newItems = [...prescriptionItems]; newItems[idx].frequency = e.target.value; setPrescriptionItems(newItems); }} className="w-1/2 text-xs p-1.5 border border-border rounded text-text" required/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {prescriptionItems.length > 0 && (
                    <div className="border border-border rounded-xl bg-surface p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><PenLine size={14}/> Doctor E-Signature</span>
                        <button type="button" onClick={clearSignature} className="text-xs bg-surface-hover/50 text-text-muted px-2 py-1 rounded hover:bg-slate-200 font-bold flex items-center gap-1">
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
                          className="mx-auto h-32 w-full rounded-xl bg-background cursor-crosshair touch-none border border-border"
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors text-sm shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Finalize & Generate PDF
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Google Meet Background Selection Modal ────────────────────────────── */}
      <Modal isOpen={isBgModalOpen} onClose={() => setIsBgModalOpen(false)} title="Visual Effects & Background Blur">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Choose background blur or a virtual environment for your video stream.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BACKGROUND_PRESETS.map((preset) => {
              const isSelected = bgPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setBgPresetId(preset.id);
                    toast.success(`Applied ${preset.label}`);
                    setIsBgModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 relative overflow-hidden group ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-border bg-surface hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {preset.type === 'image' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" 
                      style={{ backgroundImage: `url(${preset.url})` }}
                    />
                  )}
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="text-2xl">{preset.icon}</span>
                    {isSelected && (
                      <span className="bg-indigo-600 text-white p-1 rounded-full text-xs">
                        <CheckCircle size={14} />
                      </span>
                    )}
                  </div>
                  <div className="relative z-10">
                    <p className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-text'}`}>
                      {preset.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
