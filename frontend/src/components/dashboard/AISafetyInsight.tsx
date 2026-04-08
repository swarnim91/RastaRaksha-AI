import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';

const FALLBACK_TIPS = [
  "⚠️ Monsoon mein 40% zyada accidents hote hain",
  "✅ Har 2 ghante mein 15 min ka break lein",
  "🚨 Highway pe speed limit 120 km/h hai",
  "💡 Raat 2-4 baje fatigue sabse zyada hoti hai",
  "✅ Seat belt lagana Motor Vehicles Act mein compulsory hai — fine ₹1000",
  "⚠️ Mobile use karte hue driving — fine ₹5000"
];

export default function AISafetyInsight() {
  const [tip, setTip] = useState(FALLBACK_TIPS[0]);
  const [loading, setLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const fetchTip = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Give one road safety tip in Hindi',
          language: 'hi',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (data.response) {
        setTip(data.response);
      }
    } catch {
      if (!isManual) {
        const nextIdx = (tipIndex + 1) % FALLBACK_TIPS.length;
        setTipIndex(nextIdx);
        setTip(FALLBACK_TIPS[nextIdx]);
      }
    } finally {
      setLoading(false);
    }
  }, [tipIndex]);

  useEffect(() => {
    const iv = setInterval(() => fetchTip(false), 30000);
    return () => clearInterval(iv);
  }, [fetchTip]);

  return (
    <div id="ai-safety-insight-card" className="glass-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-rr-amber" />
          <h3 className="section-title !mb-0">Safety Insight</h3>
        </div>
        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
          <Sparkles className="w-2.5 h-2.5 text-rr-amber" />
          <span className="text-[8px] font-black italic text-rr-amber tracking-tighter uppercase">GROQ AI</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div key={tip} className="animate-fade-in p-2 rounded-lg bg-rr-amber/5 border border-rr-amber/10 relative overflow-hidden h-full flex items-center">
          <div className="absolute top-0 left-0 w-1 h-full bg-rr-amber/30" />
          <p className="text-rr-text text-[11px] leading-tight font-medium line-clamp-2">
            {tip}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[8px] font-black text-rr-text-muted uppercase tracking-widest">Live Safety Feed</span>
        <button 
          onClick={() => fetchTip(true)} 
          className="text-rr-text-muted hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
