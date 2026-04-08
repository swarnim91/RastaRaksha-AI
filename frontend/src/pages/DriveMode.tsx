import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Clock, Navigation, AlertTriangle,
  Moon, Sun, Phone, Eye, Volume2, VolumeX
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#2196F3;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(33,150,243,0.9);animation:ping 1.5s ease infinite;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface Blackspot {
  id: number;
  name: string;
  lat: number;
  lng: number;
  severity: string;
}

interface DriveAlert {
  id: string;
  text: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  time: string;
}

// Recenter map when position changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
}

// Routing implementation
function RoutingLayer({ userPos, destination, setRouteInfo, setNextInstruction }: any) {
  const map = useMap();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !userPos || !destination) {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
        routingRef.current = null;
      }
      return;
    }

    if (routingRef.current) {
      map.removeControl(routingRef.current);
    }

    routingRef.current = (L as any).Routing.control({
      waypoints: [
        L.latLng(userPos.lat, userPos.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#E53935', weight: 4, opacity: 0.8 }]
      },
      createMarker: (i: number, wp: any) => {
        return L.circleMarker(wp.latLng, {
          radius: i === 0 ? 8 : 12,
          fillColor: i === 0 ? '#2196F3' : '#E53935',
          fillOpacity: 0.9,
          color: 'white',
          weight: 2
        });
      }
    }).addTo(map);

    routingRef.current.on('routesfound', (e: any) => {
      const routes = e.routes;
      const summary = routes[0].summary;
      setRouteInfo({
        distance: (summary.totalDistance / 1000).toFixed(1) + ' km',
        time: Math.round(summary.totalTime / 60) + ' min'
      });
      
      if (routes[0].instructions && routes[0].instructions.length > 0) {
        setNextInstruction(routes[0].instructions[0].text);
      }
    });

    return () => {
      if (routingRef.current) map.removeControl(routingRef.current);
    };
  }, [map, userPos, destination]);

  return null;
}

export default function DriveMode() {
  const navigate = useNavigate();

  // State
  const [time, setTime] = useState(new Date());
  const [speed, setSpeed] = useState(0);
  const [location, setLocation] = useState('Detecting location...');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [blackspots, setBlackspots] = useState<Blackspot[]>([]);
  const [nearestBlackspot, setNearestBlackspot] = useState<{ name: string; dist: number } | null>(null);
  const [driverState, setDriverState] = useState<'ALERT' | 'DROWSY' | 'YAWNING' | 'NO_FACE'>('ALERT');
  const [earValue, setEarValue] = useState(0.31);
  const [activeAlert, setActiveAlert] = useState<DriveAlert | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosCalling, setSosCalling] = useState(false);

  // Navigation & Voice State
  const [destination, setDestination] = useState<{ lat: number; lng: number, name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string | null>(null);
  const [isListeningState, setIsListeningState] = useState(false);
  const isListeningRef = useRef(false);
  const setIsListening = (val: boolean) => {
    isListeningRef.current = val;
    setIsListeningState(val);
  };
  const isListening = isListeningState;

  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Refs
  const lastPos = useRef<{ lat: number; lon: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimerRef = useRef<number>(0);
  const driverVideoRef = useRef<HTMLVideoElement>(null);
  const speedLimit = 80;

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load blackspots once
  useEffect(() => {
    fetch('http://127.0.0.1:8000/detect/blackspots')
      .then(r => r.json())
      .then((data: Blackspot[]) => setBlackspots(data))
      .catch(() => {
        setBlackspots([
          { id: 1, name: 'NH-44 Delhi-Agra', lat: 28.45, lng: 77.02, severity: 'CRITICAL' },
          { id: 2, name: 'NH-58 Meerut Bypass', lat: 28.52, lng: 77.28, severity: 'HIGH' },
          { id: 3, name: 'Ring Road Flyover', lat: 28.63, lng: 77.22, severity: 'HIGH' },
        ]);
      });
  }, []);

  // GPS + camera + timer while driving
  useEffect(() => {
    if (!isDriving) return;
    let watchId: number;
    let stream: MediaStream | null = null;

    // GPS
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
          setSpeed(spd);
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserPos({ lat, lng });

          const now = Date.now();
          if (now - locationTimerRef.current > 30000) {
            locationTimerRef.current = now;
            updateLocationName(lat, lng);
          }

          if (lastPos.current) {
            setDistance(prev => prev + haversine(lastPos.current!.lat, lastPos.current!.lon, lat, lng));
          }
          lastPos.current = { lat, lon: lng };

          // Nearest blackspot
          if (blackspots.length > 0) {
            const nearest = blackspots
              .map(s => ({ name: s.name, dist: haversine(lat, lng, s.lat, s.lng) }))
              .sort((a, b) => a.dist - b.dist)[0];
            setNearestBlackspot(nearest);
          }
        },
        () => setLocation('GPS Unavailable'),
        { enableHighAccuracy: true }
      );
    }

    // Timer
    timerRef.current = setInterval(() => setDuration(p => p + 1), 1000);

    // Driver cam
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      .then(s => {
        stream = s;
        if (driverVideoRef.current) driverVideoRef.current.srcObject = s;
      })
      .catch(() => {});

    // Demo alerts
    const t1 = setTimeout(() => pushAlert({ text: 'आगे गड्ढा है! 500m', severity: 'HIGH' }), 8000);
    const t2 = setTimeout(() => pushAlert({ text: 'स्पीड ब्रेकर आगे है', severity: 'MEDIUM' }), 16000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isDriving, blackspots]);

  // Drowsiness loop
  useEffect(() => {
    if (!isDriving) return;
    const loop = async () => {
      if (!driverVideoRef.current) return;
      try {
        const c = document.createElement('canvas');
        c.width = driverVideoRef.current.videoWidth || 320;
        c.height = driverVideoRef.current.videoHeight || 240;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(driverVideoRef.current, 0, 0);
        const b64 = c.toDataURL('image/jpeg', 0.5).replace('data:image/jpeg;base64,', '');
        const res = await fetch('http://127.0.0.1:8000/detect/drowsiness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: b64 }),
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        setDriverState(data.driver_state);
        setEarValue(data.ear_value);
        if (data.alert_required) pushAlert({ text: data.alert_hindi, severity: 'HIGH' });
      } catch {}
    };
    const iv = setInterval(loop, 3000);
    return () => clearInterval(iv);
  }, [isDriving, isMuted]);

  // SOS countdown
  useEffect(() => {
    if (!sosCalling) return;
    setSosCountdown(5);
    const iv = setInterval(() => {
      setSosCountdown(p => {
        if (p <= 1) { clearInterval(iv); setSosCalling(false); return 5; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [sosCalling]);

  const pushAlert = useCallback((a: { text: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
    const alert: DriveAlert = { id: Date.now().toString(), text: a.text, severity: a.severity, time: new Date().toLocaleTimeString([], { hour12: false }) };
    setActiveAlert(alert);
    
    // Feature 3: Mute affects alerts but not visual
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(a.text);
      const lang = localStorage.getItem('language') || 'hi';
      const langMap: any = { hi: 'hi-IN', en: 'en-US', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
      u.lang = langMap[lang] || 'hi-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setActiveAlert(prev => prev?.id === alert.id ? null : prev), 6000);
  }, [isMuted]);

  // Voice Assistant Functions
  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    if (!q) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleListening = () => {
    if (isListeningRef.current) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
         pushAlert({ text: "Voice Assistance not supported on this browser", severity: "MEDIUM" });
         return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const lang = localStorage.getItem('language') || 'hi';
      const langMap: any = { hi: 'hi-IN', en: 'en-US', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
      recognition.lang = langMap[lang] || 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = async (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript;
        setIsProcessing(true);
        await processVoiceCommand(transcript);
        setIsProcessing(false);
      };

      recognition.onerror = (e: any) => {
         if (e.error !== 'no-speech') setIsListening(false);
      };

      recognition.onend = () => {
         // Auto restart if it wasn't manually stopped
         if (isListeningRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch(e){}
         } else {
            setIsListening(false);
         }
      };

      try { recognition.start(); } catch(e) {}
    }
  };

  const processVoiceCommand = async (text: string) => {
    const lang = localStorage.getItem('language') || 'hi';
    try {
      const res = await fetch('http://127.0.0.1:8000/assistant/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: lang,
          context: {
            speed: speed,
            location: location,
            destination: destination?.name || null,
            nearest_hazard: nearestBlackspot?.name || null,
            driver_state: driverState
          }
        })
      });
      const data = await res.json();
      setAssistantResponse(data.response);
      speakResponse(data.response, lang);
      
      if (data.action === 'navigate' && data.destination) {
        setSearchQuery(data.destination);
        handleSearch(data.destination);
      } else if (data.action === 'mute') {
        setIsMuted(true);
      } else if (data.action === 'sos') {
        setShowSOSModal(true);
      }
      
      setTimeout(() => setAssistantResponse(null), 5000);
    } catch (e) {
      speakResponse("माफ करें, कुछ गलत हुआ।", lang);
    }
  };

  const speakResponse = (text: string, lang: string) => {
    // Feature 3: Assistant always speaks regardless of isMuted
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langMap: any = { hi: 'hi-IN', en: 'en-US', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' };
    u.lang = langMap[lang] || 'hi-IN';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const updateLocationName = async (lat: number, lon: number) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const d = await r.json();
      setLocation(d.display_name?.split(',').slice(0, 2).join(', ') || 'Unknown');
    } catch {}
  };

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s % 60}s`;
  };

  const istTime = time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const isOverSpeed = speed > speedLimit;
  const isDrowsy = driverState === 'DROWSY';
  const stateColor = isDrowsy ? '#E53935' : driverState === 'YAWNING' ? '#FF9800' : driverState === 'ALERT' ? '#00C853' : '#4A5058';

  // Speed arc SVG
  const arcR = 120;
  const arcC = Math.PI * arcR;
  const speedPct = Math.min(speed / 120, 1);
  const arcOffset = arcC - speedPct * arcC;

  // ── START SCREEN ──────────────────────────────────────────────────────────
  if (!isDriving) {
    return (
      <div className="min-h-screen bg-[#080B0E] flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-[#E53935] to-[#b71c1c] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(229,57,53,0.3)] animate-breathe">
            <Navigation className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Drive Mode</h1>
          <p className="text-gray-400 mb-1 hindi-text">ड्राइव मोड</p>
          <p className="text-gray-500 text-sm mb-8">Real-time AI road safety monitoring</p>
          <button
            onClick={() => setIsDriving(true)}
            className="w-full py-4 bg-[#E53935] text-white font-extrabold text-lg rounded-2xl hover:shadow-[0_0_30px_rgba(229,57,53,0.4)] transition-all active:scale-95 mb-4"
          >
            ▶ START DRIVE MODE
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mx-auto text-gray-500 text-sm hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
        <video ref={driverVideoRef} autoPlay playsInline muted className="hidden" />
      </div>
    );
  }

  // ── ACTIVE DRIVE SCREEN ───────────────────────────────────────────────────
  return (
    <div
      className={`bg-[#080B0E] flex flex-col select-none overflow-hidden ${isNightMode ? 'night-mode' : ''} ${isDrowsy ? 'drive-flash-red' : ''}`}
      style={{ height: '100vh' }}
    >
      <video ref={driverVideoRef} autoPlay playsInline muted className="hidden" />

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161B20] border-b border-white/5 flex-shrink-0" style={{ height: '50px' }}>
        <div className="flex items-center gap-2">
          <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-8 h-8 rounded-lg object-cover shadow-lg" />
          <span className="text-white font-bold text-sm">RastaRaksha AI</span>
        </div>
        <span className="text-white text-lg font-extrabold tabular-nums">{istTime}</span>
        <button
          onClick={() => { navigate('/dashboard'); }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* ── MAIN 3-COLUMN CONTENT ── */}
      <div className="flex-1 grid gap-2 p-2 overflow-y-auto lg:overflow-hidden grid-cols-1 lg:grid-cols-[320px_1fr_340px]">

        {/* ════ LEFT COLUMN ════ */}
        <div className="flex flex-col gap-2 h-full overflow-hidden">
          <div className="relative rounded-xl overflow-hidden bg-black border border-white/5 shrink-0" style={{ aspectRatio: '4/3' }}>
            <video ref={driverVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#E53935] px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-[9px] font-bold uppercase">Live</span>
            </div>
          </div>

          <div className="bg-[#161B20] p-3 rounded-xl border border-white/5 text-center shrink-0">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 text-[10px] uppercase font-semibold">EAR Value</span>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums ${earValue < 0.25 ? 'text-[#E53935]' : 'text-[#00C853]'}`}>
              {earValue.toFixed(3)}
            </p>
          </div>

          <div className={`bg-[#161B20] p-3 rounded-xl border transition-all shrink-0 ${
            isDrowsy ? 'border-[#E53935]' : 'border-white/5'
          }`}>
            <div className="text-center">
              <span className="text-sm font-extrabold uppercase" style={{ color: stateColor }}>
                {driverState === 'ALERT' ? '● ALERT' : driverState === 'DROWSY' ? '⚠️ DROWSY' : driverState === 'YAWNING' ? '⚠️ YAWNING' : '— NO FACE'}
              </span>
              <p className="text-gray-500 text-[9px] mt-0.5 hindi-text">चालक की स्थिति</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="bg-[#161B20] p-2 rounded-xl border border-white/5 text-center">
              <Clock className="w-3 h-3 text-[#00C853] mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">{formatTime(duration)}</p>
            </div>
            <div className="bg-[#161B20] p-2 rounded-xl border border-white/5 text-center">
              <Navigation className="w-3 h-3 text-[#2196F3] mx-auto mb-0.5" />
              <p className="text-white text-xs font-bold">{distance.toFixed(1)} km</p>
            </div>
          </div>

          <div className="flex-1 bg-[#161B20]/40 rounded-xl border border-white/5 p-3 overflow-hidden">
            <h3 className="text-white text-[10px] font-bold uppercase mb-2">Trip Progress</h3>
            <div className="space-y-3">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#E53935]" style={{ width: '45%' }} />
              </div>
              <p className="text-[10px] text-gray-500">NH-44 Safety Zone</p>
            </div>
          </div>
        </div>

        {/* ════ CENTER COLUMN ════ */}
        <div className="flex flex-col items-center justify-start h-full overflow-hidden bg-[#080B0E]">
          
          <div className="flex flex-col items-center shrink-0 mt-8">
            <div className="relative">
              <svg width="300" height="180" viewBox="0 0 300 180">
                <path d={`M 30 160 A ${arcR} ${arcR} 0 0 1 270 160`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" strokeLinecap="round" />
                <path
                  d={`M 30 160 A ${arcR} ${arcR} 0 0 1 270 160`}
                  fill="none"
                  stroke={isOverSpeed ? '#E53935' : '#00C853'}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={arcC}
                  strokeDashoffset={arcOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-4 mt-2">
                <span className="font-black tabular-nums leading-none" style={{ fontSize: 96, color: isOverSpeed ? '#E53935' : 'white' }}>
                  {speed}
                </span>
                <span className="text-gray-500 text-sm font-bold mt-2">km/h</span>
              </div>
            </div>
            <p className={`text-sm font-bold mt-4 ${isOverSpeed ? 'text-[#E53935] animate-pulse' : 'text-gray-500'}`}>
              Limit: {speedLimit} km/h
            </p>
          </div>

          <div className="w-full flex-1 flex flex-col justify-end gap-4 mt-auto">
            <div className="w-full max-w-md shrink-0 mx-auto px-4">
              {activeAlert ? (
                <div className="bg-[#E53935]/20 border border-[#E53935]/40 p-4 rounded-2xl animate-fade-in text-center shadow-[0_0_20px_rgba(229,57,53,0.3)]">
                  <p className="text-white text-xl font-black hindi-text">⚠️ {activeAlert.text}</p>
                </div>
              ) : (
                <div className="bg-[#00C853]/10 border border-[#00C853]/20 p-4 rounded-2xl text-center">
                  <p className="text-[#00C853] text-[15px] font-bold">Safe Road Condition</p>
                </div>
              )}
            </div>

            <div className="w-full flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl shrink-0 shadow-inner">
              <MapPin className="w-4 h-4 text-[#2196F3] shrink-0 animate-pulse" />
              <span className="text-gray-400 text-xs font-bold truncate flex-1">{location}</span>
            </div>
          </div>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="flex flex-col h-full bg-[#161B20] rounded-xl border border-white/5 overflow-hidden">
          {/* Compact Map */}
          <div className="relative flex-1 min-h-[150px]">
            <MapContainer
              center={userPos ? [userPos.lat, userPos.lng] : [28.6139, 77.2090]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {userPos && <MapRecenter lat={userPos.lat} lng={userPos.lng} />}
              {userPos && (
                <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
              )}
              {destination && (
                <RoutingLayer 
                  userPos={userPos} 
                  destination={destination} 
                  setRouteInfo={setRouteInfo}
                  setNextInstruction={setNextInstruction}
                />
              )}
            </MapContainer>

            {nextInstruction && (
              <div className="absolute top-2 left-2 right-2 bg-[#E53935] p-2 rounded-lg z-[999] shadow-lg animate-slide-down">
                <p className="text-white text-[11px] font-bold flex items-center gap-2">
                  <Navigation className="w-3 h-3" /> {nextInstruction}
                </p>
              </div>
            )}

            <button 
              onClick={() => setIsFullScreenMap(true)}
              className="absolute bottom-2 right-2 z-[999] bg-[#161B20]/80 p-2 rounded-lg text-white"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 shrink-0">
            <div className="relative">
              <input 
                type="text"
                placeholder="📍 Search destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#E53935] outline-none transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 bg-black/90 border border-white/5 rounded-xl overflow-hidden animate-fade-in z-[1000] relative">
                {searchResults.map((res: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDestination({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name });
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2 text-[10px] text-gray-400 hover:bg-[#E53935]/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                  >
                    {res.display_name.split(',').slice(0, 3).join(',')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 flex flex-col gap-3 max-h-[50%] overflow-y-auto shrink-0 border-t border-white/5">
            {routeInfo ? (
              <div className="bg-[#E53935]/10 border border-[#E53935]/20 p-3 rounded-xl">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Distance</p>
                    <p className="text-white text-lg font-black">{routeInfo.distance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] uppercase font-bold">ETE</p>
                    <p className="text-[#00C853] text-lg font-black">~{routeInfo.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFullScreenMap(true)}
                  className="w-full py-2 bg-[#E53935] text-white text-[11px] font-bold rounded-lg"
                >
                  START NAVIGATION
                </button>
              </div>
            ) : (
              <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                <AlertTriangle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-[11px]">Specify destination for route guidance</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-gray-500 text-[9px] uppercase font-bold tracking-widest">Active Hazards</h4>
              {blackspots.slice(0, 3).map((spot) => (
                <div key={spot.id} className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E53935]" />
                    <span className="text-gray-400 text-[10px] truncate max-w-[150px]">{spot.name}</span>
                  </div>
                  <span className="text-[#E53935] text-[9px] font-bold">1.2 km</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="bg-[#161B20] p-2 flex gap-2 flex-shrink-0 relative" style={{ height: '70px', zIndex: 100 }}>
        
        {/* Voice Assistant Toggle */}
        <div className="flex-[1.5] max-w-[220px] flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-2 relative transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <button 
            onClick={toggleListening}
            className="flex items-center gap-2 w-full h-full text-left"
          >
            <div className={`relative shrink-0 ${isListening ? 'animate-pulse' : ''}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 ${isListening ? 'border-[#2196F3] shadow-[0_0_15px_rgba(33,150,243,0.5)]' : 'border-white/10'}`}>
                <img src="/robot-assistant.png" alt="AI Assistant" className={`w-12 h-12 object-contain transition-transform ${isListening && !isProcessing ? 'animate-bounce' : ''}`} />
              </div>
              {isListening && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00C853] rounded-full border-2 border-[#161B20] animate-pulse"></span>}
            </div>
            <div className="flex flex-col ml-1 min-w-[100px]">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isListening ? 'text-[#2196F3]' : 'text-gray-500'}`}>
                {isProcessing ? 'Thinking...' : isListening ? 'Listening' : 'Auto-Assist'}
              </span>
              <span className="text-[11px] text-gray-300 font-bold truncate leading-tight">
                {isListening ? 'Speak now...' : 'Tap to Start'}
              </span>
            </div>
          </button>
        </div>

        {/* Small Toggles */}
        <div className="flex flex-col gap-1 items-stretch justify-center flex-shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center justify-center h-full px-4 rounded-xl transition-all"
            style={{
              background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(229,57,53,0.1)',
              color: isMuted ? '#6B7280' : '#E53935',
            }}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-1 items-stretch justify-center flex-shrink-0">
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="flex items-center justify-center h-full px-4 bg-white/5 text-gray-400 rounded-xl hover:text-white"
          >
            {isNightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* SOS */}
        <button
          onClick={() => setShowSOSModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E53935] text-white rounded-xl shadow-lg border border-red-400/30 active:scale-95 transition-all"
        >
          <Phone className="w-5 h-5 animate-pulse" />
          <span className="font-black text-xs sm:text-sm tracking-wider">SOS EMERGENCY</span>
        </button>
      </div>

      {assistantResponse && (
         <div className="fixed bottom-[85px] left-4 bg-[#161B20]/95 border border-[#2196F3]/50 p-4 rounded-2xl max-w-[320px] animate-fade-in z-[200] shadow-[0_0_40px_rgba(33,150,243,0.2)] backdrop-blur-md">
           <p className="text-white text-sm font-medium">{assistantResponse}</p>
           <div className="absolute -bottom-2 left-10 w-4 h-4 bg-[#161B20] border-r border-b border-[#2196F3]/50 rotate-45" />
         </div>
      )}

      {/* ── FULL SCREEN MAP MODAL ── */}
      {isFullScreenMap && (
        <div className="fixed inset-0 z-[9999] bg-[#080B0E] flex flex-col">
          {/* Header */}
          <div className="h-16 bg-[#161B20] border-b border-white/5 flex items-center px-4 justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsFullScreenMap(false)} className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white font-bold text-lg">RastaRaksha Navigation</h2>
            </div>
          </div>
          
          {/* Main Map Area */}
          <div className="flex-1 relative overflow-hidden">
            <MapContainer
              center={userPos ? [userPos.lat, userPos.lng] : [28.6139, 77.2090]}
              zoom={16}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {userPos && <MapRecenter lat={userPos.lat} lng={userPos.lng} />}
              {userPos && (
                <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
              )}
              {destination && (
                <RoutingLayer 
                  userPos={userPos} 
                  destination={destination} 
                  setRouteInfo={setRouteInfo}
                  setNextInstruction={setNextInstruction}
                />
              )}
            </MapContainer>

            {nextInstruction && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#E53935] px-6 py-4 rounded-2xl z-[999] shadow-2xl min-w-[300px] text-center">
                <p className="text-white text-xl font-bold flex items-center justify-center gap-3">
                  <Navigation className="w-6 h-6" /> {nextInstruction}
                </p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-[#161B20] border-t border-white/5 flex-shrink-0">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase font-bold">FROM:</p>
                  <p className="text-white font-bold truncate">📍 Current Location</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase font-bold">TO:</p>
                  <p className="text-[#E53935] font-bold truncate">🔍 {destination?.name || 'Search destination'}</p>
                </div>
              </div>

              {routeInfo && (
                <div className="flex items-center justify-between px-2">
                  <p className="text-gray-400 font-bold">Route info: <span className="text-white">{routeInfo.distance} | ~{routeInfo.time}</span></p>
                </div>
              )}

              <button 
                onClick={() => setIsFullScreenMap(false)}
                className="w-full py-4 bg-[#E53935] text-white font-black rounded-xl text-lg shadow-xl shadow-red-900/20 active:scale-[0.98] transition-all"
              >
                START NAVIGATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOS MODAL ── */}
      {showSOSModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#161B20] rounded-3xl border border-[#E53935]/40 shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-[#E53935] px-6 py-5">
              <p className="text-white font-black text-2xl">EMERGENCY SOS</p>
              <p className="text-white/70 text-xs mt-1">आपातकालीन सेवाएं - Calling 112</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-[#E53935]/20 border-2 border-[#E53935] flex items-center justify-center mx-auto mb-4 animate-ping">
                  <Phone className="w-10 h-10 text-[#E53935]" />
                </div>
                <p className="text-white font-bold text-xl">Connecting Services...</p>
                <div className="mt-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E53935] text-white font-black text-xl">
                  {sosCountdown}
                </div>
              </div>
              <button
                onClick={() => setShowSOSModal(false)}
                className="w-full py-4 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all"
              >
                CANCEL / रद्द करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
