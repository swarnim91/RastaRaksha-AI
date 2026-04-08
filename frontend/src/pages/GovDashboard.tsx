import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Map as MapIcon, 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert,
  Wrench,
  Eye,
  Zap,
  Users,
  Clock,
  ArrowUpRight,
  Siren,
  CircleDot,
  BarChart3
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Stat Card ─────────────────────────────────── */
interface StatProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  trendUp?: boolean;
  accent?: string;
}

const StatCard: React.FC<StatProps> = ({ title, value, trend, icon, trendUp, accent = 'slate' }) => (
  <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-600 group">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">{title}</h3>
        <p className="text-[28px] font-black text-white mt-1.5 tracking-tight leading-tight">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${accent}-500/10 border border-${accent}-500/20 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
    <div className={`flex items-center mt-3 text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
      {trendUp ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
      <span>{trend} vs last week</span>
    </div>
  </div>
);

/* ── Live Alert Feed Item ──────────────────────── */
const AlertItem: React.FC<{type: string; message: string; time: string; severity: string}> = ({ type, message, time, severity }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:bg-slate-800/50 transition-colors group cursor-pointer">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
      severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
      severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    }`}>
      {type === 'accident' ? <Siren size={16} /> : type === 'pothole' ? <CircleDot size={16} /> : <AlertTriangle size={16} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{message}</p>
      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{time}</p>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0 ${
      severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' :
      severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400' :
      'bg-amber-500/15 text-amber-400'
    }`}>{severity}</span>
  </div>
);

/* ── Mini Progress Bar ─────────────────────────── */
const ProgressBar: React.FC<{label: string; value: number; color: string}> = ({ label, value, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-slate-400 font-semibold">{label}</span>
      <span className="text-white font-black">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);


/* ── Main Dashboard ────────────────────────────── */
export default function GovDashboard() {
  const [potholes, setPotholes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setTimeout(() => {
      setPotholes([
        { id: 1, lat: 28.7041, lng: 77.1025, severity: "CRITICAL", label: "NH-58 Meerut Sector" },
        { id: 2, lat: 28.5355, lng: 77.3910, severity: "MEDIUM", label: "Noida Sec-62 Link Rd" },
        { id: 3, lat: 28.6139, lng: 77.2090, severity: "HIGH", label: "India Gate Ring Rd" },
        { id: 4, lat: 28.4595, lng: 77.0266, severity: "LOW", label: "Gurugram CyberHub" },
        { id: 5, lat: 28.4089, lng: 77.3178, severity: "CRITICAL", label: "Faridabad-Ballabgarh" },
        { id: 6, lat: 28.6508, lng: 77.2319, severity: "HIGH", label: "ITO Flyover" },
        { id: 7, lat: 28.5500, lng: 77.2500, severity: "MEDIUM", label: "Sarita Vihar Main" },
        { id: 8, lat: 28.7200, lng: 77.0600, severity: "CRITICAL", label: "GT Karnal Rd" },
      ]);
    }, 800);
  }, []);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        
        <main className="p-6 flex-1">
          {/* Top Header Bar */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                National Command Center
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 uppercase tracking-[0.15em]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Live
                </span>
              </h1>
              <p className="text-slate-500 mt-0.5 text-xs font-semibold">
                Real-time road safety intelligence for Government of India
              </p>
            </div>
            
            {/* RHI Badge */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-xl">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">Road Health Index</p>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 leading-tight">76<span className="text-base text-slate-600">/100</span></p>
              </div>
              <div className="h-10 w-px bg-slate-700"></div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Moderate
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Delhi NCR Avg</span>
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <StatCard 
              title="Potholes Detected" 
              value="1,432" 
              trend="+12%" 
              trendUp={false}
              accent="blue"
              icon={<Wrench size={20} className="text-blue-400" />} 
            />
            <StatCard 
              title="Active Blackspots" 
              value="84" 
              trend="-5%" 
              trendUp={true}
              accent="rose"
              icon={<AlertTriangle size={20} className="text-rose-400" />} 
            />
            <StatCard 
              title="Speed Violations / Day" 
              value="412" 
              trend="+1.2%" 
              trendUp={false}
              accent="amber"
              icon={<Zap size={20} className="text-amber-400" />} 
            />
            <StatCard 
              title="Emergency Dispatches" 
              value="28" 
              trend="-15%" 
              trendUp={true}
              accent="emerald"
              icon={<ShieldAlert size={20} className="text-emerald-400" />} 
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Map — 7 cols */}
            <div className="col-span-12 lg:col-span-7 bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
              <div className="px-5 py-3 border-b border-slate-700/40 bg-slate-800/60 flex justify-between items-center backdrop-blur-md">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <MapIcon className="text-cyan-400" size={16} />
                  Live Hotspot Analytics
                </h2>
                <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Critical
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">High</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Low</span>
                </div>
              </div>
              <div className="flex-1 relative">
                <MapContainer 
                  center={[28.6139, 77.2090]} 
                  zoom={10} 
                  style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                  />
                  {potholes.map(p => (
                    <CircleMarker 
                      key={p.id}
                      center={[p.lat, p.lng]} 
                      radius={p.severity === 'CRITICAL' ? 14 : p.severity === 'HIGH' ? 10 : p.severity === 'MEDIUM' ? 7 : 5}
                      pathOptions={{ 
                        color: getMarkerColor(p.severity), 
                        fillColor: getMarkerColor(p.severity), 
                        fillOpacity: 0.5,
                        weight: 2
                      }}
                    >
                      <Popup>
                        <div className="p-1 min-w-[180px]">
                          <p className="font-bold text-sm border-b pb-1 mb-2">{p.label}</p>
                          <p className="text-xs">Severity: <strong>{p.severity}</strong></p>
                          <p className="text-xs text-gray-500 mt-1">Lat: {p.lat}, Lng: {p.lng}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Right Column — 5 cols */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
              
              {/* Live Alerts Feed */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Siren size={16} className="text-rose-400" />
                    Live Alert Feed
                  </h2>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">
                    Last 1hr
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  <AlertItem type="accident" message="Collision detected – NH-58 Meerut" time="2 min ago" severity="CRITICAL" />
                  <AlertItem type="pothole" message="New cluster – GT Karnal Road" time="8 min ago" severity="HIGH" />
                  <AlertItem type="speed" message="Speed violation surge – Outer Ring" time="15 min ago" severity="HIGH" />
                  <AlertItem type="pothole" message="Depth increase – ITO Flyover" time="22 min ago" severity="MEDIUM" />
                  <AlertItem type="accident" message="Near-miss braking – Faridabad" time="31 min ago" severity="CRITICAL" />
                </div>
              </div>

              {/* Repair Prioritization Engine */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Wrench size={16} className="text-cyan-400" />
                    Repair Prioritization
                  </h2>
                  <button className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    View All <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { rank: 1, route: "Delhi-Meerut Expressway", risk: "CRITICAL", req: "Pothole Patching", score: 98 },
                    { rank: 2, route: "NH-48 Jaipur Highway", risk: "HIGH", req: "Blackspot Lighting", score: 87 },
                    { rank: 3, route: "Outer Ring Road", risk: "HIGH", req: "Lane Marking", score: 79 },
                  ].map(item => (
                    <div key={item.rank} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0
                        ${item.rank === 1 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 
                          'bg-orange-500/15 text-orange-400 border border-orange-500/30'}`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.route}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{item.req} · Score {item.score}/100</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shrink-0
                        ${item.risk === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 'bg-orange-500/15 text-orange-400'}`}>
                        {item.risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row — Full Width Analytics */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
              
              {/* Road Condition Breakdown */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
                <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-400" />
                  Road Condition Index
                </h2>
                <ProgressBar label="National Highways" value={72} color="bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <ProgressBar label="State Highways" value={58} color="bg-gradient-to-r from-amber-500 to-amber-400" />
                <ProgressBar label="District Roads" value={41} color="bg-gradient-to-r from-orange-500 to-orange-400" />
                <ProgressBar label="Urban Roads" value={64} color="bg-gradient-to-r from-cyan-500 to-cyan-400" />
              </div>

              {/* Active Contractors */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
                <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Users size={16} className="text-amber-400" />
                  Contractor Activity
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                    <div className="text-xl font-black text-white">12</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Active Tasks</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                    <div className="text-xl font-black text-emerald-400">7</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Completed</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                    <div className="text-xl font-black text-amber-400">3</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Pending</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                    <div className="text-xl font-black text-rose-400">2</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Overdue</div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
                <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Eye size={16} className="text-emerald-400" />
                  System Vitals
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Edge Devices Online</span>
                    <span className="text-xs font-black text-emerald-400">347 / 350</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Data Pipeline</span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">HEALTHY</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">ML Model Accuracy</span>
                    <span className="text-xs font-black text-white">94.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Avg Response Time</span>
                    <span className="text-xs font-black text-white">142ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Last Prediction Refresh</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Clock size={12} className="text-indigo-400" /> 3m ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
