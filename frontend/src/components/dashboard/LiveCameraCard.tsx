import { useEffect, useRef, useState } from 'react';
import { Video, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Detection {
  label: string;
  confidence: number;
  bbox: number[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  hindi_label: string;
}

interface BackendResponse {
  detections: Detection[];
  frame_processed: boolean;
  fps: number;
  total_detections: number;
  alert_hindi: string;
  alert_english: string;
  alert_required: boolean;
}

interface DrowsinessResponse {
  driver_state: 'DROWSY' | 'YAWNING' | 'ALERT' | 'NO_FACE';
  ear_value: number;
  mar_value: number;
  alert_required: boolean;
  alert_hindi: string;
  alert_english: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CameraAlert {
  id: string;
  type: string;
  hindi_text: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  confidence: number;
}

interface LiveCameraCardProps {
  onDetection?: (alert: CameraAlert) => void;
  onDriverStateChange?: (state: string, ear: number | null, hindi: string) => void;
}

type CameraTab = 'road' | 'driver' | 'drive';

export default function LiveCameraCard({ onDetection, onDriverStateChange }: LiveCameraCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fps, setFps] = useState(0);
  const [objectCount, setObjectCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [cameraTab, setCameraTab] = useState<CameraTab>('road');
  const [driverState, setDriverState] = useState('--');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [roadAnalysis, setRoadAnalysis] = useState<string>('');

  const handleTabClick = (tab: CameraTab) => {
    if (tab === 'drive') {
      navigate('/drive');
      return;
    }
    setCameraTab(tab);
  };

  // Camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: cameraTab === 'road' ? 'environment' : 'user',
          },
        })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {});
    } else {
      setDetections([]);
      setFps(0);
      setConfidence(0);
      setObjectCount(0);
      setDriverState('--');
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isActive, cameraTab]);

  // Pothole detection loop
  useEffect(() => {
    if (!isActive) return;
    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused) return;
      try {
        const c = document.createElement('canvas');
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
        const b64 = c.toDataURL('image/jpeg', 0.7).replace('data:image/jpeg;base64,', '');
        const res = await fetch('http://127.0.0.1:8000/detect/pothole', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: b64 }),
        });
        if (!res.ok) throw new Error('err');
        const result: BackendResponse = await res.json();
        setFps(result.fps);
        setObjectCount(result.detections.length);
        setDetections(result.detections);
        if (result.detections.length > 0) {
          const mc = Math.max(...result.detections.map(d => d.confidence)) * 100;
          setConfidence(Math.round(mc));
          if (onDetection) {
            const d = result.detections[0];
            onDetection({
              id: Date.now().toString(),
              type: d.label,
              hindi_text: result.alert_hindi,
              severity: d.severity,
              timestamp: new Date().toLocaleTimeString([], { hour12: false }),
              confidence: d.confidence,
            });
          }
        } else setConfidence(0);
        drawOverlay(result.detections);
      } catch {
        // silent
      }
    };
    const iv = setInterval(loop, 2000);
    return () => clearInterval(iv);
  }, [isActive, onDetection]);

  // Drowsiness detection loop
  useEffect(() => {
    if (!isActive) return;
    const loop = async () => {
      if (!videoRef.current) return;
      try {
        const c = document.createElement('canvas');
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
        const b64 = c.toDataURL('image/jpeg', 0.7).replace('data:image/jpeg;base64,', '');
        const res = await fetch('http://127.0.0.1:8000/detect/drowsiness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: b64 }),
        });
        if (!res.ok) throw new Error('err');
        const result: DrowsinessResponse = await res.json();
        setDriverState(result.driver_state);
        onDriverStateChange?.(result.driver_state, result.ear_value, result.alert_hindi);
        if (result.alert_required && !isMuted) {
          const u = new SpeechSynthesisUtterance(result.alert_hindi);
          u.lang = 'hi-IN';
          window.speechSynthesis.speak(u);
        }
      } catch { /* silent */ }
    };
    const iv = setInterval(loop, 3000);
    return () => clearInterval(iv);
  }, [isActive, isMuted, onDriverStateChange]);

  // Road analysis effect
  useEffect(() => {
    if (!isActive || detections.length === 0) {
      if (!isActive) setRoadAnalysis('');
      return;
    }
    
    const getAnalysis = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/genai/road-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detections, location: "Indian Highway" })
        });
        const data = await res.json();
        setRoadAnalysis(data.analysis);
      } catch {
        // Fallback
      }
    };

    const timer = setTimeout(getAnalysis, 4000); 
    return () => clearTimeout(timer);
  }, [isActive, detections]);

  const drawOverlay = (dets: Detection[]) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / video.videoWidth;
    const sy = canvas.height / video.videoHeight;
    dets.forEach(d => {
      const [x1, y1, x2, y2] = d.bbox;
      const bx = x1 * sx, by = y1 * sy, bw = (x2 - x1) * sx, bh = (y2 - y1) * sy;
      ctx.strokeStyle = d.severity === 'HIGH' ? '#E53935' : '#FF9800';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = d.severity === 'HIGH' ? '#E53935' : '#FF9800';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`${d.hindi_label} ${Math.round(d.confidence * 100)}%`, bx, by > 16 ? by - 6 : by + 16);
    });
  };

  const tabs: { key: CameraTab; label: string }[] = [
    { key: 'road', label: 'Road' },
    { key: 'driver', label: 'Driver' },
    { key: 'drive', label: '🚗 Drive Mode' },
  ];

  return (
    <div
      id="live-camera-card"
      className={`glass-card h-full flex flex-col overflow-hidden relative transition-all duration-300 ${
        driverState === 'DROWSY' ? 'border-rr-red/50 glow-red' : detections.length > 0 ? 'border-rr-red/30' : ''
      }`}
    >
      {/* Header - Tabs and Toggle */}
      <div className="flex items-center justify-between p-2 border-b border-white/5 bg-rr-card/50">
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-rr-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-tight ${
                cameraTab === tab.key && tab.key !== 'drive'
                  ? 'bg-rr-blue/20 text-rr-blue'
                  : tab.key === 'drive'
                  ? 'text-rr-green hover:bg-rr-green/10 flex items-center gap-1 font-black text-[11px]'
                  : 'text-rr-text-muted hover:text-rr-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-md transition-all ${
              isMuted ? 'text-gray-500 bg-white/5' : 'text-rr-red bg-rr-red/10'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
              isActive ? 'bg-rr-red text-white hover:bg-rr-red/80' : 'bg-rr-green text-white hover:bg-rr-green/80'
            }`}
          >
            {isActive ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Video area - Fills available space */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0">
        {isActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />
            <div className="absolute top-2 left-2 flex gap-1.5">
              <div className="flex items-center gap-1 bg-rr-red px-1.5 py-0.5 rounded shadow-lg">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[8px] font-black uppercase">LIVE</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center opacity-40">
            <Video className="w-10 h-10 text-rr-text-muted mx-auto mb-2" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Feed Inactive</p>
          </div>
        )}
      </div>

      {/* AI Road Analysis Panel - Slide down if analysis exists */}
      {isActive && roadAnalysis && (
        <div className="bg-[#E539350d] border-l-2 border-[#E53935] p-2 mx-2 mb-1 animate-slide-down flex items-start gap-2">
           <div className="shrink-0 text-base mt-0.5">🤖</div>
           <div className="flex-1">
             <p className="text-[11px] font-black text-rr-red uppercase tracking-widest mb-0.5">AI Analysis</p>
             <p className="text-[#8B9299] text-[12px] font-medium leading-tight hindi-text">
               {roadAnalysis}
             </p>
           </div>
        </div>
      )}

      {/* Bottom HUD - Compact */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-rr-bg/80 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-rr-text-muted font-bold uppercase">FPS</span>
            <span className="text-[11px] font-black tabular-nums">{fps.toFixed(1)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-rr-text-muted font-bold uppercase">Objects</span>
            <span className={`text-[11px] font-black tabular-nums ${objectCount > 0 ? 'text-rr-red' : ''}`}>{objectCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-rr-text-muted font-bold uppercase">Conf</span>
            <span className="text-[11px] font-black tabular-nums">{confidence}%</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-3">
            <span className="text-[9px] text-rr-text-muted font-bold uppercase">Model</span>
            <span className="text-[11px] font-black text-rr-blue">YOLOv8</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-rr-blue uppercase tracking-widest">
           {cameraTab === 'road' ? 'Road Analysis' : 'Driver Monitor'}
        </div>
      </div>

    </div>
  );
}

