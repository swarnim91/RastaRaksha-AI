import { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface RiskData {
  total_score: number;
  road_risk: number;
  driver_risk: number;
  speed_risk: number;
  risk_level: string;
  status_hindi: string;
}

const MOCK: RiskData = {
  total_score: 28,
  road_risk: 15,
  driver_risk: 8,
  speed_risk: 5,
  risk_level: 'LOW',
  status_hindi: 'ड्राइविंग सुरक्षित है',
};

function getColor(v: number) {
  if (v <= 30) return '#00C853';
  if (v <= 60) return '#FF9800';
  return '#E53935';
}

function getLabel(v: number) {
  if (v <= 30) return { en: 'SAFE', hi: 'सुरक्षित' };
  if (v <= 60) return { en: 'CAUTION', hi: 'सावधान' };
  return { en: 'DANGER', hi: 'खतरा' };
}

export default function RiskGauge() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [score, setScore] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRisk = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/risk-score', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('err');
      const json: RiskData = await res.json();
      setData(json);
      setOffline(false);
    } catch {
      setData(MOCK);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRisk();
    intervalRef.current = setInterval(fetchRisk, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchRisk]);

  // Animate score
  useEffect(() => {
    if (!data) return;
    const target = data.total_score;
    let current = score;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      const step = Math.max(1, Math.abs(target - current) / 15);
      if (Math.abs(current - target) <= step) {
        current = target;
        if (animRef.current) clearInterval(animRef.current);
      } else {
        current += current < target ? step : -step;
      }
      setScore(Math.round(current));
    }, 30);
    return () => { if (animRef.current) clearInterval(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const color = getColor(score);
  const label = getLabel(data?.total_score ?? 0);

  const bars = data ? [
    { label: 'Road Risk', hi: 'सड़क जोखिम', value: data.road_risk, max: 40 },
    { label: 'Driver Risk', hi: 'चालक जोखिम', value: data.driver_risk, max: 40 },
    { label: 'Speed Risk', hi: 'गति जोखिम', value: data.speed_risk, max: 20 },
  ] : [];

  return (
    <div id="risk-gauge-card" className="glass-card h-[280px] relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none transition-all duration-1000" style={{ background: `radial-gradient(ellipse at 50% 30%, ${color}, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-rr-red/10">
            <Activity className="w-3.5 h-3.5 text-rr-red" />
          </div>
          <h3 className="section-title !mb-0">Risk Score</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${offline ? 'text-rr-red border-rr-red/30' : 'text-rr-green border-rr-green/30'}`}>
            {offline ? 'MOCK' : 'LIVE'}
          </span>
          <button onClick={fetchRisk} className="p-1 rounded-md hover:bg-white/5 text-rr-text-muted hover:text-rr-text transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center mb-1 relative z-10">
        <div className="relative w-[120px] h-[120px]">
          <div className="absolute inset-0 rounded-full opacity-20 blur-md transition-all duration-1000" style={{ boxShadow: `0 0 20px 4px ${color}` }} />
          <svg className="transform -rotate-90 w-[120px] h-[120px]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="44"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={(2 * Math.PI * 44) - (score / 100) * (2 * Math.PI * 44)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <div className="skeleton w-8 h-4" />
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl font-black tabular-nums leading-none mb-0.5" style={{ color }}>{score}</span>
                <span className="text-[10px] font-bold tracking-tighter uppercase" style={{ color }}>{label.en}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-score bars */}
      <div className="space-y-1 relative z-10 flex-1 flex flex-col justify-end">
        {bars.map((b, i) => {
          const pct = Math.min((b.value / b.max) * 100, 100);
          const bColor = getColor(pct);
          return (
            <div key={i} className="mb-0.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-rr-text-muted text-[8px] font-bold uppercase tracking-tight">{b.label}</span>
                <span className="text-rr-text text-[9px] font-black tabular-nums">{b.value}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: loading ? '0%' : `${pct}%`, backgroundColor: bColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
