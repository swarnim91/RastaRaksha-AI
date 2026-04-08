import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, Trash2, Volume2, VolumeX } from 'lucide-react';

export interface Alert {
  id: string;
  type: string;
  hindi_text: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  confidence: number;
}

interface AlertPanelProps {
  newAlert?: Alert | null;
}

export default function AlertPanel({ newAlert }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const lastVoiceTime = useRef<Record<string, number>>({});

  // Handle incoming alerts from props
  useEffect(() => {
    if (newAlert) {
      // Prevent duplicates from same detection event (if needed)
      setAlerts(prev => {
        const updated = [newAlert, ...prev].slice(0, 20);
        return updated;
      });

      // Voice Alert Logic
      if (newAlert.severity === 'HIGH' && !isMuted) {
        const now = Date.now();
        const lastTime = lastVoiceTime.current[newAlert.type] || 0;
        
        // Don't repeat same alert within 10 seconds
        if (now - lastTime > 10000) {
          triggerVoiceAlert(newAlert.hindi_text);
          triggerBeep();
          lastVoiceTime.current[newAlert.type] = now;
        }
      }
    }
  }, [newAlert]);

  const triggerVoiceAlert = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const triggerBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 880; // A5
      gain.gain.value = 0.1;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('AudioContext beep failed:', e);
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
    lastVoiceTime.current = {};
  };

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#1A1A1A]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-[#E53935]" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E53935] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">Security Alerts</h3>
            <p className="text-gray-400 text-xs">सुरक्षा अलर्ट</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={clearAlerts}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-[#E53935]"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <AlertTriangle className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400">System Monitoring Active</p>
            <p className="text-gray-600 text-sm">No critical alerts detected</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert, idx) => (
            <div
              key={alert.id || idx}
              className={`p-4 rounded-xl border animate-in slide-in-from-right duration-500 transition-all ${
                alert.severity === 'HIGH' 
                  ? 'bg-[#E53935]/10 border-[#E53935]/30' 
                  : alert.severity === 'MEDIUM'
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  alert.severity === 'HIGH' 
                    ? 'bg-[#E53935] text-white' 
                    : alert.severity === 'MEDIUM'
                    ? 'bg-orange-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {alert.severity}
                </span>
                <span className="text-gray-500 text-[10px] flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {alert.timestamp}
                </span>
              </div>
              
              <div className="text-white font-bold text-lg mb-1 leading-tight">
                {alert.hindi_text}
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-gray-400 text-xs font-medium uppercase tracking-widest">
                  {alert.type}
                </div>
                <div className="text-white/60 text-xs font-mono">
                  CONF: {Math.round(alert.confidence * 100)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / History Badge */}
      {alerts.length > 5 && (
        <div className="p-3 bg-black/20 border-t border-[#2A2A2A] text-center">
          <button className="text-gray-500 text-[10px] font-bold uppercase hover:text-white transition-colors">
            View {alerts.length - 5} Previous Alerts
          </button>
        </div>
      )}
    </div>
  );
}
