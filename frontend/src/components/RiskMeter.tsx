import { useEffect, useState, useRef } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RiskData {
  total_score: number;
  road_risk: number;
  driver_risk: number;
  speed_risk: number;
  risk_level: string;
  status_hindi: string;
}

const MOCK_DATA: RiskData = {
  total_score: 45,
  road_risk: 20,
  driver_risk: 18,
  speed_risk: 7,
  risk_level: 'MEDIUM',
  status_hindi: 'ड्राइविंग सामान्य है',
};

function getColor(value: number) {
  if (value <= 30) return '#4CAF50';
  if (value <= 60) return '#FF9800';
  return '#E53935';
}

function getStatus(value: number) {
  if (value <= 30) return { en: 'SAFE', hi: 'सुरक्षित' };
  if (value <= 60) return { en: 'MEDIUM', hi: 'सामान्य' };
  return { en: 'DANGER', hi: 'खतरा' };
}

export default function RiskMeter() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRisk = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/risk-score', {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error('Non-2xx');
      const json: RiskData = await res.json();
      setData(json);
      setOffline(false);
    } catch {
      setData(MOCK_DATA);
      setOffline(true);
    } finally {
      setLoading(false);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
  };

  useEffect(() => {
    fetchRisk();
    intervalRef.current = setInterval(fetchRisk, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Animate score counter
  useEffect(() => {
    if (!data) return;
    const target = data.total_score;
    let current = animatedScore;
    const step = Math.abs(target - current) / 20;
    const timer = setInterval(() => {
      if (Math.abs(current - target) <= step) {
        current = target;
        clearInterval(timer);
      } else {
        current += current < target ? step : -step;
      }
      setAnimatedScore(Math.round(current));
    }, 30);
    return () => clearInterval(timer);
  }, [data]);

  const score = animatedScore;
  const color = getColor(score);
  const status = getStatus(data?.total_score ?? 0);
  const circumference = 2 * Math.PI * 72;
  const offset = circumference - (score / 100) * circumference;

  const subScores = data
    ? [
        { label: 'Road Risk', labelHi: 'सड़क जोखिम', value: data.road_risk },
        { label: 'Driver Risk', labelHi: 'चालक जोखिम', value: data.driver_risk },
        { label: 'Speed Risk', labelHi: 'गति जोखिम', value: data.speed_risk },
      ]
    : [];

  return (
    <div
      className="rounded-xl border border-[#2A2A2A] p-6 relative overflow-hidden"
      style={{ background: '#1A1A1A' }}
    >
      {/* Glowing background accent */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${color} 0%, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#E53935]/10">
            <Activity className="w-5 h-5 text-[#E53935]" />
          </div>
          <div>
            <h3 className="text-white font-semibold tracking-wide">Live Risk Score</h3>
            <p className="text-gray-400 text-xs">जोखिम स्कोर मीटर</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connectivity badge */}
          <span
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
            style={{
              color: offline ? '#E53935' : '#4CAF50',
              borderColor: offline ? '#E53935' : '#4CAF50',
              backgroundColor: offline ? '#E5393510' : '#4CAF5010',
            }}
          >
            {offline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {offline ? 'Offline' : 'Live'}
          </span>

          {/* Refresh spinner */}
          <button
            onClick={fetchRisk}
            className="p-1.5 rounded-lg hover:bg-[#2A2A2A] transition-colors text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="relative w-44 h-44">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-md transition-all duration-1000"
            style={{ boxShadow: `0 0 40px 10px ${color}` }}
          />

          <svg className="transform -rotate-90 w-44 h-44" viewBox="0 0 160 160">
            {/* Track */}
            <circle cx="80" cy="80" r="72" stroke="#2A2A2A" strokeWidth="10" fill="none" />
            {/* Progress arc */}
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke={color}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={loading ? circumference : offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease, stroke 1s ease',
                filter: `drop-shadow(0 0 6px ${color})`,
              }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-gray-500 text-sm animate-pulse">Loading…</div>
            ) : (
              <>
                <div
                  className="text-5xl font-extrabold tabular-nums leading-none"
                  style={{ color, textShadow: `0 0 20px ${color}60` }}
                >
                  {score}
                </div>
                <div className="text-gray-400 text-xs mt-1">/ 100</div>
              </>
            )}
          </div>
        </div>

        {/* Status labels */}
        <div className="text-center mt-4">
          <div
            className={`text-2xl font-bold tracking-widest transition-all duration-500 ${pulse ? 'scale-110' : 'scale-100'}`}
            style={{ color }}
          >
            {status.en}
          </div>
          <div className="text-gray-300 text-base mt-0.5">{data?.status_hindi ?? '...'}</div>
          <div className="text-gray-500 text-xs mt-1">{status.hi}</div>
        </div>
      </div>

      {/* Sub-score bars */}
      <div className="space-y-3 relative z-10">
        {subScores.map((item, index) => {
          const barColor = getColor(item.value * 2.5); // scale 0-40 → 0-100
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-200 text-sm font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{item.labelHi}</span>
                  <span className="text-white text-sm font-bold">{item.value}</span>
                </div>
              </div>
              <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: loading ? '0%' : `${item.value}%`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 8px ${barColor}80`,
                    transition: 'width 1s ease, background-color 1s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-refresh indicator */}
      <p className="text-gray-600 text-xs text-center mt-4 relative z-10">
        ↻ Auto-refresh every 5s
      </p>
    </div>
  );
}
