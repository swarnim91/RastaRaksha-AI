import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WeeklyTrend() {
  const [data, setData] = useState<number[]>([0,0,0,0,0,0,0]);
  const [average, setAverage] = useState<number>(0);
  
  useEffect(() => {
    fetch('http://127.0.0.1:8000/reports/summary')
      .then(res => res.json())
      .then(json => {
        if (json.weekly_scores) {
          // Reverse if needed or mapping directly depending on backend logic
          // Backend returns [d-6, d-5, ... d-0]
          setData(json.weekly_scores);
          setAverage(json.avg_risk_score);
        }
      })
      .catch(err => console.error("Error fetching trend data:", err));
  }, []);

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const w = 300, h = 80;
  
  const available_h = h - 12;
  const available_w = w - 16;
  const offset_y = 6;
  const offset_x = 8;
  const points = data.map((v, i) => 
    `${offset_x + (i/(data.length-1 || 1))*available_w},${h - offset_y - ((v-min)/(Math.max(1, max-min)))*available_h}`
  ).join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;
  
  // Last 7 days dynamic labels
  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  });

  return (
    <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden bg-rr-green/5 border-rr-green/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <TrendingUp className="w-4 h-4 text-rr-green" />
           <h3 className="section-title !mb-0">Weekly Trend</h3>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[8px] font-bold text-rr-text-muted uppercase">Average</span>
           <span className="text-sm font-black text-rr-green uppercase tabular-nums tracking-tighter">{average}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[60px]">
        {/* SVG Graph */}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C853" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <polygon points={areaPoints} fill="url(#areaGradient)" />
          
          <polyline 
            points={points} 
            fill="none" 
            stroke="#00C853" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {data.map((v, i) => (
            <circle 
              key={i}
              cx={offset_x + (i/(data.length-1 || 1))*available_w} 
              cy={h - offset_y - ((v-min)/(Math.max(1, max-min)))*available_h}
              r="4"
              fill="#080B0E"
              stroke="#00C853"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between mt-3 px-1">
        {days.map((d, i) => (
          <span key={i} className="text-[7px] font-black text-rr-text-muted tracking-widest">{d}</span>
        ))}
      </div>
    </div>
  );
}
