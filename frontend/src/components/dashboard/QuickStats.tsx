import { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Activity, CloudSun } from 'lucide-react';

export default function QuickStats() {
  const [potholes, setPotholes] = useState(0);
  const [blackspots, setBlackspots] = useState(0);
  const [chatPoints, setChatPoints] = useState(0);
  const [weather, setWeather] = useState<{ temp: number; city: string; main: string } | null>(null);

  useEffect(() => {
    // Fetch stats
    fetch('http://127.0.0.1:8000/reports/summary')
      .then(res => res.json())
      .then(data => setPotholes(data.alert_breakdown?.pothole || 0))
      .catch(err => console.error(err));

    fetch('http://127.0.0.1:8000/blackspots')
      .then(res => res.json())
      .then(data => {
        if (data.blackspots) setBlackspots(data.blackspots.length);
      })
      .catch(err => console.error(err));

    // Get chat count from localStorage
    const history = localStorage.getItem('rr_chat_history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        setChatPoints(parsed.length);
      } catch {
        setChatPoints(0);
      }
    } else {
      setChatPoints(0);
    }

    // Weather Fetching
    const fetchWeather = async () => {
      try {
        const apiKey = "03511f003bd2df4860fdf531450cd65a";
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${apiKey}&units=metric`);
        const data = await res.json();
        if (data.main) {
          setWeather({ temp: Math.round(data.main.temp), city: data.name, main: data.weather[0].main });
        }
      } catch (err) {
        console.error("Weather error:", err);
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="flex gap-2 w-full h-[60px]">
      <StatItem 
        label="TODAY'S POTHOLES" 
        value={potholes} 
        icon={<ShieldAlert className="w-3.5 h-3.5 text-rr-red" />} 
        color="text-rr-red"
      />
      <StatItem 
        label="ACTIVE HAZARDS" 
        value={blackspots} 
        icon={<MapPin className="w-3.5 h-3.5 text-rr-blue" />} 
        color="text-rr-blue"
      />
      <StatItem 
        label="AI CONSULTS" 
        value={chatPoints} 
        icon={<Activity className="w-3.5 h-3.5 text-rr-green" />} 
        color="text-rr-green"
      />
      <StatItem 
        label="WEATHER" 
        value={weather ? `${weather.temp}°C ${weather.main}` : '--'} 
        icon={<CloudSun className="w-3.5 h-3.5 text-rr-blue" />} 
        color="text-rr-blue"
      />
    </div>
  );
}

function StatItem({ label, value, icon, color }: { label: string, value: number | string, icon: React.ReactNode, color: string }) {
  return (
    <div className="glass-card flex-1 flex flex-col justify-center min-w-0 !p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest text-rr-text-muted truncate">{label}</span>
      </div>
      <div className={`text-sm font-black tabular-nums leading-none ${color} truncate`}>
        {value}
      </div>
    </div>
  );
}
