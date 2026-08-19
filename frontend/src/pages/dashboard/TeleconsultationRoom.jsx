import { useState, useEffect, useRef, useCallback } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Activity, FileText, Pill, 
  Plus, CheckCircle, Wifi, MessageCircle, Send, PenLine, Eraser, 
  Sparkles, MonitorUp, X, Clock, Settings, Check, MoreVertical
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

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Detects voice activity on a MediaStream using Web Audio AnalyserNode.
// Clones the audio track and keeps the monitor enabled so speaking is detected even when the user is muted ("Are you talking?" nudge).
function useSpeakingIndicator(stream) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const holdTimerRef = useRef(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }
    const originalTrack = stream.getAudioTracks()[0];
    if (!originalTrack) return;

    let active = true;
    let audioContext, analyser, microphone, scriptProcessor;
    let monitorTrack;

    try {
      // Clone track so disabling the main track for WebRTC doesn't mute local speech detection
      monitorTrack = originalTrack.clone();
      monitorTrack.enabled = true;
      const monitorStream = new MediaStream([monitorTrack]);

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      microphone = audioContext.createMediaStreamSource(monitorStream);
      scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);

      microphone.connect(analyser);
      analyser.connect(scriptProcessor);

      // Route to zero gain so no local audio feedback is played through speakers
      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      scriptProcessor.connect(muteGain);
      muteGain.connect(audioContext.destination);

      scriptProcessor.onaudioprocess = () => {
        if (!active) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        // Analyze vocal frequency band (approx 100Hz to 3000Hz -> bins 2 to 35 on 512 FFT)
        const vocalBins = data.slice(2, 36);
        const vocalAvg = vocalBins.reduce((a, b) => a + b, 0) / vocalBins.length;

        if (vocalAvg > 16) {
          setIsSpeaking(true);
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
          }
          // Keep speaking state active for 1.2s after last vocal sound to prevent flickering between words
          holdTimerRef.current = setTimeout(() => {
            if (active) setIsSpeaking(false);
          }, 1200);
        }
      };
    } catch {
      /* AudioContext fallback */
    }

    return () => {
      active = false;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      scriptProcessor?.disconnect();
      analyser?.disconnect();
      microphone?.disconnect();
      if (monitorTrack) {
        monitorTrack.stop();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [stream]);

  return isSpeaking;
}

function TeleconsultationRoomContent() {
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
  const [activeSidePanel, setActiveSidePanel] = useState('none'); // 'chat' | 'clinical' | 'none' — auto-opens after join
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [isRemoteSharingScreen, setIsRemoteSharingScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isAiActive, setIsAiActive] = useState(false);

  // WebRTC & Hardware State
  const [availableCameras, setAvailableCameras] = useState([]);
  const [availableMics, setAvailableMics] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [lobbyStream, setLobbyStream] = useState(null);
  const lobbyVideoRef = useRef(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
  // Hardware health alerts — Google Meet style
  const [micLost, setMicLost] = useState(false);       // mic track ended unexpectedly
  const [cameraLost, setCameraLost] = useState(false); // camera track ended unexpectedly
  
  const [remoteStream, setRemoteStream] = useState(null);
  const pcRef = useRef(null);
  const processedSignals = useRef(new Set());
  const mySessionId = useRef(null);
  const targetSessionId = useRef(null);
  const iceCandidateQueue = useRef([]);
  const remoteVideoRef = useRef(null);
  const [medicines, setMedicines] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [videoQuality, setVideoQuality] = useState(getAdaptiveVideoQuality);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);

  
  // Vitals State
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '' });
  
  // Sync existing vitals when consultation data loads
  useEffect(() => {
    if (consultation?.vital_signs) {
      setVitals(prev => ({
        blood_pressure: consultation.vital_signs.blood_pressure || prev.blood_pressure,
        heart_rate: consultation.vital_signs.heart_rate || prev.heart_rate,
        temperature: consultation.vital_signs.temperature || prev.temperature,
      }));
    }
  }, [consultation?.vital_signs]);

  // Doctor Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseGateFrameRef = useRef(null);
  const chatListRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const signatureStrokesRef = useRef([]);
  const selfieSegmentationRef = useRef(null);
  const canvasStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const sessionStartedAt = useRef(null); // timestamp when "Join" was clicked — filters out stale signals from previous sessions

  // Voice activity detection — drives the "Are you talking?" nudge and green glow
  const localSpeaking = useSpeakingIndicator(callActive ? streamRef.current : lobbyStream);
  const remoteSpeaking = useSpeakingIndicator(remoteStream);

  const bgPreset = BACKGROUND_PRESETS.find((b) => b.id === bgPresetId) || BACKGROUND_PRESETS[0];
  const bgPresetRef = useRef(bgPreset);
  const bgImgRef = useRef(null);

  useEffect(() => {
    bgPresetRef.current = bgPreset;
    if (bgPreset.type === 'image' && bgPreset.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgPreset.url;
      bgImgRef.current = img;
    } else {
      bgImgRef.current = null;
    }
  }, [bgPreset]);

  // Pre-join Lobby Initialization
  useEffect(() => {
    let stream;
    let isMounted = true;
    const initDevices = async () => {
      try {
        // Request basic permission first
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        const mics = devices.filter(d => d.kind === 'audioinput');
        
        setAvailableCameras(cameras);
        setAvailableMics(mics);
        
        if (!selectedCameraId && cameras.length > 0) setSelectedCameraId(cameras[0].deviceId);
        if (!selectedMicId && mics.length > 0) setSelectedMicId(mics[0].deviceId);

        setLobbyStream(prevStream => {
          if (prevStream) prevStream.getTracks().forEach(t => t.stop());
          return stream;
        });

        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to init devices:", err);
      }
    };
    if (!callActive) {
      initDevices();
    }
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Device Selection Change (Lobby only)
  useEffect(() => {
    if (callActive || !selectedCameraId || !selectedMicId) return;
    
    let active = true;
    const updateLobbyStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraActive ? { deviceId: selectedCameraId } : false,
          audio: micActive ? { deviceId: selectedMicId } : false
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        setLobbyStream(prevStream => {
          if (prevStream) {
            prevStream.getTracks().forEach(t => t.stop());
          }
          return stream;
        });
        
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to update lobby stream:", err);
      }
    };

    updateLobbyStream();
    
    return () => { active = false; };
  }, [selectedCameraId, selectedMicId, callActive]);

  // Mid-Call Dynamic Device Switching (Manual Apply)
  const applyDeviceChanges = async (newCameraId, newMicId) => {
    if (!callActive || !streamRef.current || !pcRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: cameraActive ? (newCameraId ? { deviceId: { exact: newCameraId } } : true) : false,
        audio: micActive ? (newMicId ? { deviceId: { exact: newMicId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true } : true) : false
      });
      
      const oldStream = streamRef.current;
      const senders = pcRef.current.getSenders();
      
      // Replace Video Track
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = oldStream.getVideoTracks()[0];
      if (newVideoTrack && oldVideoTrack) {
        // If AI is inactive, we replace it. If AI is active, Canvas swapper handles it!
        const videoSender = senders.find(s => s.track === oldVideoTrack || s.track === canvasStreamRef.current?.getVideoTracks()[0]);
        if (videoSender && (!isAiActive || bgPresetId === 'none')) {
          await videoSender.replaceTrack(newVideoTrack);
        }
        oldVideoTrack.stop();
      } else if (oldVideoTrack) {
         // We shouldn't stop the old video track if we aren't replacing it, because the user might just be changing the mic while camera is off (which means oldVideoTrack is already stopped/undefined)
      }

      // Replace Audio Track (Process it first!)
      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = oldStream.getAudioTracks()[0];
      
      let finalStream = newStream;
      if (newAudioTrack && oldAudioTrack) {
        finalStream = enhanceAudioStream(newStream);
        const processedAudioTrack = finalStream.getAudioTracks()[0];
        
        const audioSender = senders.find(s => s.track === oldAudioTrack);
        if (audioSender) {
          await audioSender.replaceTrack(processedAudioTrack);
        }
        oldAudioTrack.stop();
      }

      // We must preserve tracks that we didn't request!
      if (!cameraActive && oldStream.getVideoTracks().length > 0) {
         // wait, if cameraActive is false, the oldStream video track is ALREADY stopped. We just carry it over so stream structure doesn't break, or we don't carry it over.
         // Actually, it's better to just construct finalStream from whatever new tracks we have.
         // Wait! newStream doesn't have a video track if cameraActive is false!
         // If we do streamRef.current = finalStream (which has no video track), then when the user clicks 'Turn On Camera', `videoTrack` will be undefined!
         // This is correct! `toggleCamera` checks `if (!videoTrack)` and requests a new one!
      }

      streamRef.current = finalStream;
      
      if (videoRef.current && videoRef.current.srcObject !== screenStreamRef.current) {
        videoRef.current.srcObject = finalStream;
        videoRef.current.play().catch(() => {});
      }
      
      setSelectedCameraId(newCameraId);
      setSelectedMicId(newMicId);
      setIsSettingsModalOpen(false);
      
      // Apply muting logic
      if (newVideoTrack) newVideoTrack.enabled = cameraActive;
      if (finalStream.getAudioTracks()[0]) finalStream.getAudioTracks()[0].enabled = micActive;

      toast.success("Devices updated successfully!");
    } catch (err) {
      console.error("Failed to switch device mid-call:", err);
      toast.error("Failed to switch devices. Make sure they are not in use.");
    }
  };

  useEffect(() => {
    if (!callActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  // Auto-open the clinical panel for Doctor on desktop once the call is active
  useEffect(() => {
    if (callActive && user?.role === 'Doctor' && window.innerWidth >= 768) {
      setActiveSidePanel('clinical');
    }
  }, [callActive, user?.role]);

  // ── Hardware Track Health Monitor ─────────────────────────────────────────
  // Watches for unexpected mic/camera shutdowns (device unplugged, browser
  // permission revoked, another app stealing the device, etc.)
  useEffect(() => {
    const stream = callActive ? streamRef.current : lobbyStream;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    const onAudioEnded = () => {
      setMicLost(true);
      setMicActive(false);
      toast.error('⚠️ Microphone disconnected unexpectedly.', { duration: 8000 });
    };
    const onVideoEnded = () => {
      setCameraLost(true);
      setCameraActive(false);
      toast.error('⚠️ Camera disconnected unexpectedly.', { duration: 8000 });
    };

    if (audioTrack) audioTrack.addEventListener('ended', onAudioEnded);
    if (videoTrack) videoTrack.addEventListener('ended', onVideoEnded);

    // Clear stale alerts when the stream changes (user recovered by reconnecting)
    setMicLost(false);
    setCameraLost(false);

    return () => {
      if (audioTrack) audioTrack.removeEventListener('ended', onAudioEnded);
      if (videoTrack) videoTrack.removeEventListener('ended', onVideoEnded);
    };
  }, [callActive, lobbyStream]);

  // MediaPipe AI Person Segmentation Initialization (Google Meet Body Detection Engine)
  useEffect(() => {
    let active = true;

    const initAiSegmenter = async () => {
      if (window.SelfieSegmentation) {
        try {
          const segmenter = new window.SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
          });

          segmenter.setOptions({
            modelSelection: 1, // 1 = Landscape model (Google Meet style)
            selfieMode: true,  // Mirroring
          });

          segmenter.onResults((results) => {
            if (!active) return;
            const canvas = canvasRef.current;
            if (!canvas || !results || !results.image) return;

            // Dynamically match the canvas dimensions to the source frame to prevent distortion
            if (canvas.width !== results.image.width) canvas.width = results.image.width;
            if (canvas.height !== results.image.height) canvas.height = results.image.height;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const currentPreset = bgPresetRef.current;

            ctx.save();
            ctx.clearRect(0, 0, width, height);

            if (currentPreset.type === 'none') {
              ctx.drawImage(results.image, 0, 0, width, height);
              ctx.restore();
              return;
            }

            if (results.segmentationMask) {
              // 1. Draw Background First
              if (currentPreset.type === 'image' && bgImgRef.current && bgImgRef.current.complete) {
                try {
                  ctx.drawImage(bgImgRef.current, 0, 0, width, height);
                } catch {
                  // Fallback if image draw fails (CORS)
                }
              } else if (currentPreset.type === 'blur') {
                ctx.filter = currentPreset.blurAmount || 'blur(12px)';
                ctx.drawImage(results.image, 0, 0, width, height);
                ctx.filter = 'none';
              }

              // 2. Cut a hole in the background where the person is
              ctx.globalCompositeOperation = 'destination-out';
              ctx.drawImage(results.segmentationMask, 0, 0, width, height);

              // 3. Draw the raw camera feed BEHIND the background (shows through the hole)
              ctx.globalCompositeOperation = 'destination-over';
              ctx.drawImage(results.image, 0, 0, width, height);
            } else {
              // Fallback if no mask
              ctx.drawImage(results.image, 0, 0, width, height);
            }

            ctx.restore();
            setIsAiActive(true);
          });

          selfieSegmentationRef.current = segmenter;
        } catch (err) {
          console.error("AI Person Segmenter Error:", err);
        }
      }
    };

    initAiSegmenter();

    return () => {
      active = false;
      if (selfieSegmentationRef.current) {
        selfieSegmentationRef.current.close().catch(() => {});
        selfieSegmentationRef.current = null;
      }
    };
  }, []);

  // Frame Processing Loop sending video frames to MediaPipe AI
  useEffect(() => {
    if ((!callActive && !lobbyStream) || !cameraActive || isSharingScreen) return;

    let frameId;
    const processAiFrame = async () => {
      const video = callActive ? videoRef.current : lobbyVideoRef.current;
      const segmenter = selfieSegmentationRef.current;

      if (
        video && 
        video.readyState >= 2 && 
        video.videoWidth > 0 && 
        video.videoHeight > 0 && 
        segmenter && 
        bgPresetRef.current.id !== 'none'
      ) {
        try {
          await segmenter.send({ image: video });
        } catch {
          // Graceful frame skip
        }
      }
      frameId = requestAnimationFrame(processAiFrame);
    };

    processAiFrame();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [callActive, cameraActive, lobbyStream, isSharingScreen]);

  // WebRTC AI Canvas Track Swapper
  useEffect(() => {
    if (!pcRef.current || isSharingScreen) return;
    
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
    if (!sender) return;

    if (bgPresetId !== 'none' && isAiActive && canvasRef.current) {
      try {
        if (!canvasStreamRef.current) {
          canvasStreamRef.current = canvasRef.current.captureStream(30);
        }
        const canvasTrack = canvasStreamRef.current.getVideoTracks()[0];
        if (canvasTrack && sender.track !== canvasTrack) {
          sender.replaceTrack(canvasTrack);
        }
      } catch (err) {
        console.warn("Could not capture stream from canvas (CORS tainted?):", err);
        // Fallback to raw camera
        if (streamRef.current) {
          const camTrack = streamRef.current.getVideoTracks()[0];
          if (camTrack && sender.track !== camTrack) sender.replaceTrack(camTrack);
        }
      }
    } else if (streamRef.current) {
      const camTrack = streamRef.current.getVideoTracks()[0];
      if (camTrack && sender.track !== camTrack) {
        sender.replaceTrack(camTrack);
      }
    }
  }, [bgPresetId, isAiActive, isSharingScreen]);

  const sendSignal = useCallback(async (payload) => {
    try {
      const signalPayload = { 
        ...payload, 
        timestamp: Date.now(), 
        senderId: user?.id,
        sessionId: mySessionId.current,
        targetSessionId: targetSessionId.current
      };
      await api.post(`/consultations/${id}/messages`, {
        message: `[WEBRTC_SIGNAL]${JSON.stringify(signalPayload)}`
      });
    } catch (err) {
      console.error('Failed to send signal', err);
    }
  }, [id, user?.id]);

  const processWebRTCSignal = useCallback(async (signal) => {
    if (!pcRef.current || !callActive) return;

    // Ignore signals sent by ourselves
    if (signal.senderId && signal.senderId === user?.id) {
      return;
    }

    // Ignore signals intended for a different session
    if (signal.targetSessionId && signal.targetSessionId !== mySessionId.current) {
      return;
    }

    // Ignore signals from a different remote session, EXCEPT if it's a new offer (which restarts the session)
    if (signal.type !== 'offer' && targetSessionId.current && signal.sessionId !== targetSessionId.current) {
      return;
    }

    try {
      if (signal.type === 'offer' && user?.role === 'Doctor') {
        targetSessionId.current = signal.sessionId;
        if (pcRef.current.signalingState !== 'stable' && pcRef.current.signalingState !== 'have-local-offer') {
          console.warn('Ignoring offer - signaling state:', pcRef.current.signalingState);
          return true; // Mark handled so it does not loop
        }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        sendSignal({ type: 'answer', answer });
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }
      } else if (signal.type === 'answer' && user?.role === 'Patient') {
        targetSessionId.current = signal.sessionId;
        if (pcRef.current.signalingState !== 'have-local-offer') {
          console.warn('Ignoring answer - signaling state:', pcRef.current.signalingState);
          return true;
        }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }
      } else if (signal.type === 'candidate') {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(console.error);
        } else {
          iceCandidateQueue.current.push(signal.candidate);
        }
      } else if (signal.type === 'vitals_sync') {
        setConsultation(prev => prev ? { ...prev, vital_signs: signal.vitals } : prev);
      } else if (signal.type === 'screen_share_stop') {
        setIsRemoteSharingScreen(false);
        setRemoteScreenStream(null);
      } else if (signal.type === 'screen_share_start') {
        setIsRemoteSharingScreen(true);
      } else if (signal.type === 'audio_status') {
        setIsRemoteMuted(!signal.enabled);
      } else if (signal.type === 'camera_status') {
        setIsRemoteCameraOff(!signal.enabled);
      }
    } catch (err) {
      console.error('WebRTC Signal Error:', err, signal);
      return false;
    }
    return true;
  }, [sendSignal, callActive, user?.id, user?.role]);

  const stopAudioProcessing = useCallback(() => {
    if (noiseGateFrameRef.current) {
      cancelAnimationFrame(noiseGateFrameRef.current);
      noiseGateFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const enhanceAudioStream = useCallback((stream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !window.AudioContext) {
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

      return new MediaStream([
        ...stream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
    } catch {
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
        // Fallback quality
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
            // Only process WebRTC signals once the current user has actually joined
            if (!sessionStartedAt.current) continue;

            const signalStr = msg.message.replace('[WEBRTC_SIGNAL]', '');
            if (!processedSignals.current.has(msg.id) && msg.sender_id !== user?.id) {
              try {
                const parsed = JSON.parse(signalStr);
                const success = await processWebRTCSignal(parsed);
                if (success) {
                  processedSignals.current.add(msg.id);
                }
              } catch (err) {
                console.error('Invalid signal JSON', err);
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
    const interval = setInterval(fetchMessages, 2000);
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

  const handleEndCall = () => {
    if (!callActive) {
      navigate('/consultations');
      return;
    }
    
    if (user?.role === 'Doctor' && consultation?.status !== 'Completed') {
      const confirmEnd = window.confirm("Are you sure you want to end the call? You have not marked the consultation as Completed yet. (To complete, fill out the Clinical panel and click Finalize)");
      if (!confirmEnd) return;
    }
    toggleCall();
  };

  const toggleCall = async () => {
    if (!callActive) {
      try {
        const initialQuality = getAdaptiveVideoQuality();
        let stream = lobbyStream;

        if (!stream) {
          const videoConstraints = {
            ...VIDEO_QUALITY_PROFILES[initialQuality].constraints,
            ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : {})
          };
          const audioConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(selectedMicId ? { deviceId: { exact: selectedMicId } } : {})
          };

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: audioConstraints,
            });
            setVideoQuality(initialQuality);
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                ...VIDEO_QUALITY_PROFILES.low.constraints,
                ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : {})
              },
              audio: audioConstraints,
            });
            setVideoQuality('low');
          }
        } else {
          // Re-use lobby stream (don't blink the camera)
          setVideoQuality(initialQuality); 
        }

        stream = enhanceAudioStream(stream);
        streamRef.current = stream;

        // Record the session start time BEFORE creating PeerConnection.
        // The signal poller uses this to ignore any signals sent before we joined.
        sessionStartedAt.current = Date.now() - 1000;
        processedSignals.current.clear();
        mySessionId.current = Math.random().toString(36).substring(7);
        targetSessionId.current = null;
        iceCandidateQueue.current = [];

        setCallActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'stun:stun.services.mozilla.com' }
          ]
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ type: 'candidate', candidate: event.candidate });
          }
        };

        // NOTE: onnegotiationneeded is intentionally NOT set here.
        // It fires automatically after addTrack and would send a duplicate offer
        // on top of the explicit one we send below, crashing the signaling state machine.

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream((prevStream) => {
              if (!prevStream || prevStream.id === event.streams[0].id) {
                return event.streams[0];
              } else {
                setRemoteScreenStream(event.streams[0]);
                return prevStream;
              }
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          setConnectionState(state);
          // Auto ICE-restart when connection drops (Patient is the offerer)
          if ((state === 'disconnected' || state === 'failed') && user?.role === 'Patient') {
            console.warn('ICE disconnected — attempting restart...');
            pc.createOffer({ iceRestart: true }).then(offer => {
              return pc.setLocalDescription(offer).then(() => {
                sendSignal({ type: 'offer', offer });
              });
            }).catch(console.error);
          }
        };

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pcRef.current = pc;

        if (user?.role === 'Patient') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'offer', offer });
        }

        // Broadcast initial hardware state to the other peer
        sendSignal({ type: 'camera_status', enabled: cameraActive });
        sendSignal({ type: 'audio_status', enabled: micActive });

      } catch (err) {
        toast.error("Camera/Microphone access denied or not found.");
        console.error(err);
        sessionStartedAt.current = null;
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
      sessionStartedAt.current = null;
      setRemoteStream(null);
      iceCandidateQueue.current = [];
      processedSignals.current.clear();

      setCallActive(false);
      navigate('/consultations');
      toast('Call ended');
    }
  };

  const toggleMic = () => {
    const streamToToggle = callActive ? streamRef.current : lobbyStream;
    if (streamToToggle) {
      const audioTrack = streamToToggle.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
        if (callActive) {
          sendSignal({ type: 'audio_status', enabled: audioTrack.enabled });
        }
      }
    }
  };

  const toggleCamera = async () => {
    const streamToToggle = callActive ? streamRef.current : lobbyStream;
    if (streamToToggle) {
      let videoTrack = streamToToggle.getVideoTracks()[0];
      if (!videoTrack && !cameraActive) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          streamToToggle.addTrack(newVideoTrack);
          
          if (callActive && pcRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video' || s.track === null);
            if (sender) await sender.replaceTrack(newVideoTrack);
          }
          if (callActive && videoRef.current) videoRef.current.srcObject = streamToToggle;
          if (!callActive && lobbyVideoRef.current) lobbyVideoRef.current.srcObject = streamToToggle;
          
          setCameraActive(true);
          if (callActive) sendSignal({ type: 'camera_status', enabled: true });
        } catch (err) {
          console.error("Camera restart error:", err);
          toast.error(`Could not restart camera: ${err.message || err.name}`);
        }
      } else if (videoTrack) {
        if (cameraActive) {
          videoTrack.stop();
          streamToToggle.removeTrack(videoTrack);
          
          if (callActive && pcRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track === videoTrack);
            if (sender) {
              await sender.replaceTrack(null).catch(() => {});
            }
          }

          setCameraActive(false);
          if (callActive) sendSignal({ type: 'camera_status', enabled: false });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isSharingScreen) {
        if (screenStreamRef.current) {
          const screenTrack = screenStreamRef.current.getVideoTracks()[0];
          if (pcRef.current && screenTrack) {
            const sender = pcRef.current.getSenders().find(s => s.track === screenTrack);
            if (sender) pcRef.current.removeTrack(sender);
          }
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        setIsSharingScreen(false);
        sendSignal({ type: 'screen_share_stop' });
        toast.success('Stopped presenting');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (pcRef.current && screenTrack) {
          pcRef.current.addTrack(screenTrack, screenStream);
        }

        setIsSharingScreen(true);
        sendSignal({ type: 'screen_share_start' });
        toast.success('Sharing screen');
        
        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            const track = screenStreamRef.current.getVideoTracks()[0];
            if (pcRef.current && track) {
              const sender = pcRef.current.getSenders().find(s => s.track === track);
              if (sender) pcRef.current.removeTrack(sender);
            }
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
          
          setIsSharingScreen(false);
          sendSignal({ type: 'screen_share_stop' });
        };
      } catch {
        // User cancelled screen share picker
      }
    }
  };

  const saveVitals = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/consultations/${id}/vitals`, vitals);
      toast.success('Vitals recorded to database!');
      
      // Update local state immediately
      setConsultation(prev => prev ? { ...prev, vital_signs: response.data } : prev);
      
      // Broadcast over the WebRTC signaling channel so the doctor sees it live
      sendSignal({ type: 'vitals_sync', vitals: response.data });
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
      
      const validItems = prescriptionItems.filter(item => item.medicine_id !== '');
      if (validItems.length > 0) {
        const svg = buildSignatureSvg();
        if (!svg) {
          toast.error('Your e-signature was empty or not captured properly. Please draw it again.');
          return;
        }

        await api.post('/prescriptions', {
          consultation_id: id,
          patient_id: consultation?.patient_id,
          notes: `Diagnosis: ${diagnosis}`,
          doctor_signature_svg: svg,
          items: validItems
        });
        toast.success('E-Prescription generated officially!');
      }

      toast.success('Consultation marked as Completed!');
      navigate('/consultations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error completing consultation');
    }
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { id: crypto.randomUUID(), medicine_id: '', dosage: '', frequency: '' }]);
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

  useEffect(() => {
    if (callActive && videoRef.current && streamRef.current) {
      if (!isSharingScreen && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [callActive, cameraActive, bgPresetId, isSharingScreen]);

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-screen overflow-hidden bg-slate-950 text-white">
      {/* ── Main Video Stage (Google Meet Widescreen) ─────────────────────────── */}
            <div data-tour="page-video" className="flex-1 h-full bg-slate-900 relative shadow-2xl flex flex-col">
        <JitsiMeeting
          domain="jitsi.riot.im"
          roomName={`CabuyaoCHO1-Teleconsultation-${id}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            prejoinConfig: { enabled: true, hideDisplayName: true },
            disableDeepLinking: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          }}
          userInfo={{
            displayName: user?.name || (user?.role === 'Doctor' ? 'Doctor' : 'Patient')
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('videoConferenceJoined', () => {
              if (user?.role === 'Doctor' && consultation?.status === 'scheduled') {
                api.put(`/consultations/${id}`, { status: 'in_progress' }).catch(console.error);
              }
            });
            externalApi.addListener('readyToClose', () => {
              handleEndCall();
            });
          }}
          getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; }}
        />
        
        {/* Floating action button to open sidebar on mobile or if closed */}
        {activeSidePanel === 'none' && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button onClick={() => setActiveSidePanel('chat')} className="bg-indigo-600 p-3 rounded-full text-white shadow-lg hover:bg-indigo-700">
              <MessageCircle size={20} />
            </button>
            <button onClick={handleEndCall} className="bg-rose-600 p-3 rounded-full text-white shadow-lg hover:bg-rose-700">
              <PhoneOff size={20} />
            </button>
          </div>
        )}
      </div>

      {activeSidePanel !== 'none' && (
        <div className="absolute inset-0 z-50 md:relative md:inset-auto w-full md:w-[24rem] lg:w-[30rem] flex flex-col bg-surface h-full border-l border-border shrink-0 animate-in slide-in-from-right duration-300">
          
          {/* Chat Drawer */}
          {activeSidePanel === 'chat' && (
            <div data-tour="page-chat" className="flex-1 flex flex-col h-full bg-surface">
              <div className="flex justify-between items-center p-4 border-b border-border bg-background shrink-0">
                <h3 className="font-semibold text-text flex items-center gap-2">
                  <MessageCircle size={18} className="text-teal-500"/> In-Call Chat
                </h3>
                <button onClick={() => setActiveSidePanel('none')} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-background">
                  <X size={18} />
                </button>
              </div>

              <div ref={chatListRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-background">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-text-light text-center py-16">No messages yet. Send a message to participants.</p>
                ) : chatMessages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${isMine ? 'bg-teal-500 text-white rounded-br-md' : 'bg-surface text-text-muted border border-border rounded-bl-md'}`}>
                        <div className="text-[10px] opacity-75 font-semibold mb-0.5">{message.sender?.name || (isMine ? 'You' : 'User')}</div>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendChatMessage} className="p-4 bg-surface border-t border-border flex gap-2 shrink-0">
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
            <div data-tour="page-form" className="flex-1 flex flex-col h-full bg-surface">
              <div className="flex justify-between items-center p-4 border-b border-border bg-background shrink-0">
                <h3 className="font-semibold text-text flex items-center gap-2">
                  <Activity size={18} className="text-sky-500"/> Vital Signs & Consultation Form
                </h3>
                <button onClick={() => setActiveSidePanel('none')} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-background">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Vitals Form / Display */}
                <div className="space-y-3">
                {user?.role === 'Patient' ? (
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
              {user?.role === 'Doctor' && (
                <form className="space-y-4 flex-1 flex flex-col" onSubmit={completeConsultation}>
                  <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Observed symptoms..." className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0 text-text" required />
                  <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Official Diagnosis..." className="w-full px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none h-16 shrink-0 text-text" required />
                  
                  <div className="border border-border rounded-xl p-3 bg-background flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-text-muted flex items-center gap-1"><Pill size={14}/> Prescribe Medicines</span>
                      <button type="button" onClick={addPrescriptionItem} className="text-xs bg-emerald-100 text-success-text px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center"><Plus size={12}/> Add</button>
                    </div>
                    
                    <div className="space-y-3">
                      {prescriptionItems.length === 0 && <p className="text-xs text-text-light text-center py-2">No medicines prescribed yet.</p>}
                      {prescriptionItems.map((item, idx) => (
                        <div key={item.id} className="bg-surface p-2 rounded-lg border border-border space-y-2">
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
                        <span className="text-sm font-semibold text-text-muted flex items-center gap-1"><PenLine size={14}/> Doctor E-Signature</span>
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
            </div>
          )}
        </div>
      )}

      {/* Device Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Change Camera / Mic">
        <div className="space-y-6">
          <p className="text-sm text-text-muted">
            Change your camera and microphone during the call.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Camera</label>
              <select 
                id="modal-camera-select"
                defaultValue={selectedCameraId}
                className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none"
              >
                {availableCameras.length === 0 && <option value="">Default Camera</option>}
                {availableCameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Microphone</label>
              <select 
                id="modal-mic-select"
                defaultValue={selectedMicId}
                className="w-full bg-slate-800/80 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none"
              >
                {availableMics.length === 0 && <option value="">Default Microphone</option>}
                {availableMics.map(mic => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Mic ${mic.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => {
                const camId = document.getElementById('modal-camera-select').value;
                const micId = document.getElementById('modal-mic-select').value;
                applyDeviceChanges(camId, micId);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* 🚀 Google Meet Background Selection Modal 🚀 */}
      <Modal isOpen={isBgModalOpen} onClose={() => setIsBgModalOpen(false)} title="Visual Effects & AI Background Blur">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Choose AI person-segmentation background blur or a virtual environment for your video stream.
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

export default function TeleconsultationRoom() {
  return (
    <ErrorBoundary>
      <TeleconsultationRoomContent />
    </ErrorBoundary>
  );
}

