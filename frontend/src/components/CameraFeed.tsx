import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, WifiOff } from 'lucide-react';
import { Alert } from './AlertPanel';

interface Detection {
  label: string;
  confidence: number;
  bbox: number[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  hindi_label: string;
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

interface BackendResponse {
  detections: Detection[];
  frame_processed: boolean;
  fps: number;
  total_detections: number;
  alert_hindi: string;
  alert_english: string;
  alert_required: boolean;
  error?: string;
}

interface CameraFeedProps {
  onDetection?: (alert: Alert) => void;
}

export default function CameraFeed({ onDetection }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  
  // Custom driver state requested by user
  const [driverState, setDriverState] = useState<string>('--');
  const [earValue, setEarValue] = useState<number | null>(null);
  const [drowsyAlertHindi, setDrowsyAlertHindi] = useState<string>('');

  // 1. Establish Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isDetecting && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsOffline(false);
        })
        .catch((err) => {
          console.error('Camera access denied:', err);
        });
    } else {
      setDetections([]);
      setFps(0);
      setConfidence(0);
      setDriverState('--');
      setEarValue(null);
      setDrowsyAlertHindi('');
    }
    
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isDetecting]);

  // 2. Setup Pothole Detection Interval
  useEffect(() => {
    if (!isDetecting) return;

    const captureAndSendPothole = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.7).replace('data:image/jpeg;base64,', '');
        
        const response = await fetch('http://127.0.0.1:8000/detect/pothole', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        
        if (!response.ok) throw new Error('Pothole Backend error');
        
        const result: BackendResponse = await response.json();
        setIsOffline(false);
        setFps(result.fps);
        setDetectionCount(result.detections.length);
        setDetections(result.detections);

        if (result.detections.length > 0) {
          const maxConf = Math.max(...result.detections.map(d => d.confidence)) * 100;
          setConfidence(Math.round(maxConf));
          if (onDetection) {
            const primaryDetection = result.detections[0];
            onDetection({
              id: Date.now().toString(),
              type: primaryDetection.label,
              hindi_text: result.alert_hindi,
              severity: primaryDetection.severity,
              timestamp: new Date().toLocaleTimeString([], { hour12: false }),
              confidence: primaryDetection.confidence
            });
          }
        } else {
          setConfidence(0);
        }
        drawOverlay(result.detections);
      } catch (error) {
        console.error('Pothole loop error:', error);
        setIsOffline(true);
        setDetections([]);
      }
    };

    const potholeInterval = setInterval(captureAndSendPothole, 2000);

    return () => {
      clearInterval(potholeInterval);
    };
  }, [isDetecting, onDetection]);

  // 3. Setup Drowsiness Detection Interval
  useEffect(() => {
    if (!isDetecting) return;

    const sendDrowsinessFrame = async () => {
      if (!videoRef.current || !isDetecting) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.7)
                           .replace('data:image/jpeg;base64,', '');
      
      try {
        const res = await fetch('http://127.0.0.1:8000/detect/drowsiness', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({image: base64})
        });
        
        if (!res.ok) throw new Error('Drowsiness Backend error');

        const result: DrowsinessResponse = await res.json();
        console.log("Drowsiness Result:", result);
        
        setDriverState(result.driver_state);
        setEarValue(result.ear_value);
        setDrowsyAlertHindi(result.alert_hindi);
        
        if (result.alert_required) {
          const u = new SpeechSynthesisUtterance(result.alert_hindi);
          u.lang = "hi-IN";
          window.speechSynthesis.speak(u);
        }
      } catch(e) {
        console.log("Drowsiness API error:", e);
      }
    };

    const interval = setInterval(sendDrowsinessFrame, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [isDetecting]);

  const drawOverlay = (currentDetections: Detection[]) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    currentDetections.forEach((d) => {
      const [x1, y1, x2, y2] = d.bbox;
      const bx = x1 * scaleX;
      const by = y1 * scaleY;
      const bw = (x2 - x1) * scaleX;
      const bh = (y2 - y1) * scaleY;

      ctx.strokeStyle = d.severity === 'HIGH' ? '#E53935' : '#FF9800';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = d.severity === 'HIGH' ? '#E53935' : '#FF9800';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${d.hindi_label} ${Math.round(d.confidence * 100)}%`, bx, by > 20 ? by - 10 : by + 20);
    });
  };

  return (
    <div className={`bg-[#1A1A1A] rounded-xl border ${driverState === 'DROWSY' ? 'border-[#E53935] border-4 shadow-[0_0_40px_rgba(229,57,53,0.6)] animate-pulse' : detections.length > 0 ? 'border-[#E53935] shadow-[0_0_15px_rgba(229,57,53,0.3)]' : 'border-[#2A2A2A]'} transition-all duration-300 overflow-hidden relative shadow-2xl`}>
      <div className="border-b border-[#2A2A2A] p-4 flex items-center justify-between relative z-10 bg-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${detections.length > 0 ? 'bg-[#E53935]/20 animate-pulse' : 'bg-[#2A2A2A]'}`}>
            <Video className={`w-5 h-5 ${detections.length > 0 ? 'text-[#E53935]' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">Live Camera Feed</h3>
            <p className="text-gray-400 text-xs">लाइव कैमरा फीड</p>
          </div>
        </div>

        <button
          onClick={() => setIsDetecting(!isDetecting)}
          className={`px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 ${isDetecting
              ? 'bg-[#E53935] text-white hover:bg-[#C62828]'
              : 'bg-[#4CAF50] text-white hover:bg-[#43A047]'
            }`}
        >
          {isDetecting ? (
            <span className="flex items-center gap-2">
              <VideoOff className="w-4 h-4" /> Stop Detection
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4" /> Start Detection
            </span>
          )}
        </button>
      </div>

      <div className="relative bg-[#050505] aspect-video flex items-center justify-center">
        {isDetecting ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none w-full h-full"
            />

            {/* Status Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-[#E53935] text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg ring-2 ring-white/20">
                LIVE
              </div>
              {isOffline && (
                <div className="bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                  <WifiOff className="w-3 h-3" /> Backend Offline
                </div>
              )}
            </div>

            {/* Pothole Overlay */}
            {detections.length > 0 && driverState !== 'DROWSY' && driverState !== 'YAWNING' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                <div className="bg-[#E53935]/20 backdrop-blur-sm border-2 border-[#E53935] rounded-full px-8 py-3 animate-ping opacity-20" />
              </div>
            )}

            {/* Drowsiness Overlays */}
            {driverState === 'DROWSY' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none text-center">
                <div className="bg-red-600/90 backdrop-blur-md border-[3px] border-red-400 text-white font-black text-2xl px-12 py-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.9)] animate-pulse">
                  {drowsyAlertHindi}
                </div>
              </div>
            )}
            
            {driverState === 'YAWNING' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none text-center">
                <div className="bg-orange-500/90 backdrop-blur-md border-[3px] border-orange-300 text-white font-bold text-xl px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                  {drowsyAlertHindi}
                </div>
              </div>
            )}
            
            {driverState === 'ALERT' && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
                <div className="bg-green-500/90 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-green-300 shadow-lg">
                  Driver Alert ✅
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-12">
            <div className="w-20 h-20 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium text-lg">Webcam processing inactive</p>
            <p className="text-gray-600 text-sm mt-1">Start detection to see real results from backend</p>
          </div>
        )}
      </div>

      <div className="border-t border-[#2A2A2A] p-4 bg-[#0A0A0A] flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">System FPS</span>
            <span className="text-white font-mono text-base">{fps.toFixed(1)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Objects</span>
            <span className="text-[#E53935] font-bold text-base">{detectionCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">State</span>
            <span className="text-white font-bold text-base">{driverState}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">EAR</span>
            <span className={`font-bold text-base ${earValue !== null ? (earValue < 0.25 ? 'text-red-500' : 'text-green-500') : 'text-gray-400'}`}>
              {earValue !== null ? earValue.toFixed(2) : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Confidence</span>
            <span className={`${confidence > 70 ? 'text-green-500' : 'text-orange-500'} font-bold text-base`}>
              {confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
