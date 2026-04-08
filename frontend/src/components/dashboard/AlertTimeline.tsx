import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Volume2 } from 'lucide-react';

export interface TimelineAlert {
  id: string;
  type: string;
  hindi_text: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  confidence: number;
}

interface AlertTimelineProps {
  alerts: TimelineAlert[];
}

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  CRITICAL: { color: '#B71C1C', bg: 'bg-rr-red/20', border: 'border-l-rr-red', icon: '💀' },
  HIGH: { color: '#E53935', bg: 'bg-rr-red/10', border: 'border-l-rr-red', icon: '🚨' },
  MEDIUM: { color: '#FF9800', bg: 'bg-rr-amber/10', border: 'border-l-rr-amber', icon: '⚠️' },
  LOW: { color: '#00C853', bg: 'bg-rr-green/10', border: 'border-l-rr-green', icon: '✅' },
};

export default function AlertTimeline({ alerts }: AlertTimelineProps) {
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const prevLength = useRef(safeAlerts.length);

  useEffect(() => {
    if (safeAlerts.length > prevLength.current && safeAlerts[0]) {
      setAnimatedIds(prev => new Set(prev).add(safeAlerts[0].id));
      setTimeout(() => {
        setAnimatedIds(prev => {
          const next = new Set(prev);
          next.delete(safeAlerts[0].id);
          return next;
        });
      }, 600);
    }
    prevLength.current = safeAlerts.length;
  }, [safeAlerts]);

  const visible = safeAlerts.slice(0, 5);

  const getGenAIExplanation = async (type: string, severity: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/genai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, severity, location: "Indian highway" })
      });
      const data = await res.json();
      return data.explanation;
    } catch {
      return "सावधान रहें!";
    }
  };

  useEffect(() => {
    const fetchNewExplanations = async () => {
      for (const alert of visible) {
        if (alert.severity === 'HIGH' && !explanations[alert.id]) {
          const explanation = await getGenAIExplanation(alert.type, alert.severity);
          setExplanations(prev => ({ ...prev, [alert.id]: explanation }));
        }
      }
    };
    fetchNewExplanations();
  }, [visible]);
  const speakAlert = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'hi-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div id="alert-timeline-card" className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rr-red" />
          <h3 className="section-title !mb-0">Alert Feed</h3>
        </div>
        {safeAlerts.length > 0 && (
          <span className="text-[9px] font-black bg-rr-red text-white px-1.5 py-0.5 rounded-full tabular-nums">
            {safeAlerts.length}
          </span>
        )}
      </div>

      {/* Alerts Container - Fixed height with internal scroll */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {visible.map(alert => {
          const cfg = severityConfig[alert.severity];
          const isNew = animatedIds.has(alert.id);
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-2 p-2 rounded-lg border-l-2 transition-all duration-300 ${cfg.bg} ${isNew ? 'animate-pulse' : ''}`}
              style={{ borderLeftColor: cfg.color }}
            >
              <span className="text-base flex-shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-rr-text text-[11px] font-bold hindi-text leading-tight truncate">{alert.hindi_text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] font-black uppercase tracking-tighter" style={{ color: cfg.color }}>{alert.severity}</span>
                  <span className="text-rr-text-muted text-[8px] uppercase font-bold truncate">{alert.type}</span>
                  {alert.severity === 'HIGH' && (
                    <span className="bg-rr-red/10 text-rr-red text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                       GenAI Enabled
                    </span>
                  )}
                </div>
                {alert.severity === 'HIGH' && explanations[alert.id] && (
                  <div className="mt-1 flex flex-col gap-1">
                    <p className="text-[#8B9299] text-[10px] italic leading-tight">
                      💡 {explanations[alert.id]}
                    </p>
                    <div className="flex">
                      <span className="bg-[#E539351a] text-[#E53935] text-[7px] px-1.5 py-0.5 rounded-[10px] font-bold uppercase">
                        Generated by GenAI
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-rr-text-muted text-[8px] tabular-nums font-bold flex items-center gap-0.5">
                   {alert.timestamp}
                </span>
                <button onClick={() => speakAlert(alert.hindi_text)} className="p-0.5 hover:bg-white/10 rounded transition-colors mt-0.5">
                  <Volume2 className="w-2.5 h-2.5 text-rr-text-muted" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
