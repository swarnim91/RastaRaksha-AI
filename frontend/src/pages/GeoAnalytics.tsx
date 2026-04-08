import { useState, Fragment } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Map as MapIcon, Layers, Eye, EyeOff, AlertTriangle, CircleDot, Zap, Lightbulb, Building2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Mock Data ─────────────────────────────────── */
const POTHOLE_DATA = [
  { id: 'p1', lat: 28.6139, lng: 77.2090, severity: "CRITICAL", count: 18, road: "India Gate Ring Road" },
  { id: 'p2', lat: 28.7041, lng: 77.1025, severity: "HIGH", count: 12, road: "NH-58 Meerut Bypass" },
  { id: 'p3', lat: 28.5355, lng: 77.3910, severity: "MEDIUM", count: 6, road: "Noida Sec-62 Link" },
  { id: 'p4', lat: 28.4595, lng: 77.0266, severity: "LOW", count: 3, road: "Gurugram CyberHub Rd" },
  { id: 'p5', lat: 28.7200, lng: 77.0600, severity: "CRITICAL", count: 22, road: "GT Karnal Rd NH-44" },
  { id: 'p6', lat: 28.4089, lng: 77.3178, severity: "HIGH", count: 9, road: "Faridabad-Ballabgarh" },
  { id: 'p7', lat: 28.6508, lng: 77.2319, severity: "CRITICAL", count: 15, road: "ITO Flyover" },
];

const BLACKSPOT_DATA = [
  { id: 'b1', lat: 28.6300, lng: 77.2200, accidents: 42, road: "Pragati Maidan Curve", risk: 92 },
  { id: 'b2', lat: 28.5800, lng: 77.3300, accidents: 35, road: "Noida-Greater Noida Eway", risk: 87 },
  { id: 'b3', lat: 28.6800, lng: 77.1500, accidents: 28, road: "Azadpur Flyover", risk: 78 },
  { id: 'b4', lat: 28.4300, lng: 77.0500, accidents: 31, road: "Hero Honda Chowk", risk: 84 },
];

const SPEED_VIOLATION_DATA = [
  { id: 's1', lat: 28.5600, lng: 77.2800, violations: 156, road: "Outer Ring Road" },
  { id: 's2', lat: 28.6400, lng: 77.1200, violations: 98, road: "Rohtak Road NH-10" },
  { id: 's3', lat: 28.5100, lng: 77.4000, violations: 124, road: "DND Flyway" },
];

const INFRA_GAP_DATA = [
  { id: 'ig1', lat: 28.5900, lng: 77.2500, gap: "No Street Lighting", road: "BRT Corridor Sec 37", priority: "HIGH" },
  { id: 'ig2', lat: 28.6700, lng: 77.0800, gap: "Missing Speed Breakers", road: "School Zone Pitampura", priority: "CRITICAL" },
  { id: 'ig3', lat: 28.4800, lng: 77.1500, gap: "No Pedestrian Crossing", road: "Mehrauli-Badarpur", priority: "HIGH" },
  { id: 'ig4', lat: 28.7400, lng: 77.1100, gap: "Damaged Guard Rails", road: "GT Karnal Overpass", priority: "CRITICAL" },
];

const DISTRICT_STATS = [
  { name: "Central Delhi", potholes: 142, blackspots: 8, rhi: 52, status: "Critical" },
  { name: "South Delhi", potholes: 98, blackspots: 5, rhi: 68, status: "Moderate" },
  { name: "North Delhi", potholes: 186, blackspots: 12, rhi: 41, status: "Critical" },
  { name: "East Delhi", potholes: 73, blackspots: 4, rhi: 71, status: "Good" },
  { name: "Gurugram", potholes: 64, blackspots: 6, rhi: 74, status: "Good" },
  { name: "Noida", potholes: 89, blackspots: 7, rhi: 63, status: "Moderate" },
  { name: "Faridabad", potholes: 112, blackspots: 9, rhi: 48, status: "Critical" },
  { name: "Ghaziabad", potholes: 95, blackspots: 6, rhi: 59, status: "Moderate" },
];

type LayerKey = 'potholes' | 'blackspots' | 'speed' | 'infraGaps';

/* ── Component ─────────────────────────────────── */
export default function GeoAnalytics() {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    potholes: true,
    blackspots: true,
    speed: false,
    infraGaps: false,
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const toggleLayer = (key: LayerKey) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const layerConfig: { key: LayerKey; label: string; icon: React.ReactNode; color: string; count: number }[] = [
    { key: 'potholes', label: 'Pothole Hotspots', icon: <CircleDot size={14} />, color: 'rose', count: POTHOLE_DATA.length },
    { key: 'blackspots', label: 'Accident Blackspots', icon: <AlertTriangle size={14} />, color: 'orange', count: BLACKSPOT_DATA.length },
    { key: 'speed', label: 'Speed Violations', icon: <Zap size={14} />, color: 'amber', count: SPEED_VIOLATION_DATA.length },
    { key: 'infraGaps', label: 'Infra Gap Zones', icon: <Lightbulb size={14} />, color: 'violet', count: INFRA_GAP_DATA.length },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Left Control Panel */}
          <div className="w-[300px] shrink-0 bg-slate-900/50 border-r border-slate-800/60 flex flex-col overflow-hidden">
            
            {/* Layer Controls */}
            <div className="p-4 border-b border-slate-800/60">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                <Layers size={13} /> Map Layers
              </h2>
              <div className="space-y-2">
                {layerConfig.map(l => (
                  <button
                    key={l.key}
                    onClick={() => toggleLayer(l.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border ${
                      layers[l.key]
                        ? `bg-${l.color}-500/10 border-${l.color}-500/20 text-${l.color}-300`
                        : 'bg-slate-800/30 border-slate-700/30 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${layers[l.key] ? `bg-${l.color}-500/20` : 'bg-slate-800'}`}>
                      {l.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-[12px] font-bold block">{l.label}</span>
                      <span className="text-[10px] opacity-60">{l.count} zones</span>
                    </div>
                    {layers[l.key] ? <Eye size={14} className="opacity-60" /> : <EyeOff size={14} className="opacity-30" />}
                  </button>
                ))}
              </div>
            </div>

            {/* District Drill-Down */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                <Building2 size={13} /> District Drill-Down
              </h2>
              <div className="space-y-2">
                {DISTRICT_STATS.map(d => (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDistrict(selectedDistrict === d.name ? null : d.name)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      selectedDistrict === d.name
                        ? 'bg-slate-700/40 border-cyan-500/30'
                        : 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold text-white">{d.name}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        d.status === 'Critical' ? 'bg-rose-500/15 text-rose-400' :
                        d.status === 'Moderate' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-emerald-500/15 text-emerald-400'
                      }`}>{d.status}</span>
                    </div>
                    
                    {selectedDistrict === d.name && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-sm font-black text-white">{d.potholes}</div>
                          <div className="text-[9px] text-slate-500 font-bold">Potholes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-white">{d.blackspots}</div>
                          <div className="text-[9px] text-slate-500 font-bold">Blackspots</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-black ${d.rhi < 50 ? 'text-rose-400' : d.rhi < 65 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.rhi}</div>
                          <div className="text-[9px] text-slate-500 font-bold">RHI</div>
                        </div>
                      </div>
                    )}

                    {/* Mini RHI bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        d.rhi < 50 ? 'bg-gradient-to-r from-rose-500 to-rose-400' :
                        d.rhi < 65 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                        'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`} style={{ width: `${d.rhi}%` }}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Infrastructure Gap Summary */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-900/70">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                <Lightbulb size={13} className="text-violet-400" /> Infra Gap Summary
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-700/30">
                  <div className="text-lg font-black text-rose-400">4</div>
                  <div className="text-[9px] text-slate-500 font-bold">Critical Gaps</div>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-slate-700/30">
                  <div className="text-lg font-black text-amber-400">₹8.2 Cr</div>
                  <div className="text-[9px] text-slate-500 font-bold">Fix Cost Est.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Map Header */}
            <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <MapIcon size={16} className="text-cyan-400" />
                Geospatial Intelligence Map — Delhi NCR
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 text-[9px] font-black uppercase tracking-wider">
                  {layers.potholes && <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Potholes</span>}
                  {layers.blackspots && <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">Blackspots</span>}
                  {layers.speed && <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Speed</span>}
                  {layers.infraGaps && <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">Infra Gaps</span>}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={[28.6139, 77.2090]}
                zoom={11}
                style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM &copy; CARTO'
                />

                {/* Pothole Layer */}
                {layers.potholes && POTHOLE_DATA.map(p => (
                  <Fragment key={p.id}>
                    <CircleMarker center={[p.lat, p.lng]} radius={p.severity === 'CRITICAL' ? 18 : p.severity === 'HIGH' ? 14 : 10} pathOptions={{ fillColor: getColor(p.severity), fillOpacity: 0.08, weight: 0 }} />
                    <CircleMarker center={[p.lat, p.lng]} radius={p.severity === 'CRITICAL' ? 10 : p.severity === 'HIGH' ? 7 : 5}
                      pathOptions={{ fillColor: getColor(p.severity), fillOpacity: 0.5, weight: 2, color: getColor(p.severity) }}
                    >
                      <Popup><div className="min-w-[180px] p-1"><p className="font-bold text-sm">{p.road}</p><p className="text-xs text-gray-500">Severity: <strong>{p.severity}</strong></p><p className="text-xs text-gray-500">Detections: {p.count}</p></div></Popup>
                    </CircleMarker>
                  </Fragment>
                ))}

                {/* Blackspot Layer */}
                {layers.blackspots && BLACKSPOT_DATA.map(b => (
                  <CircleMarker key={b.id} center={[b.lat, b.lng]} radius={12}
                    pathOptions={{ fillColor: '#f97316', fillOpacity: 0.4, weight: 2, color: '#f97316', dashArray: '4 4' }}
                  >
                    <Popup><div className="min-w-[180px] p-1"><p className="font-bold text-sm">{b.road}</p><p className="text-xs">Accidents: {b.accidents} · Risk: {b.risk}/100</p></div></Popup>
                  </CircleMarker>
                ))}

                {/* Speed Violation Layer */}
                {layers.speed && SPEED_VIOLATION_DATA.map(s => (
                  <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={s.violations > 120 ? 16 : 10}
                    pathOptions={{ fillColor: '#eab308', fillOpacity: 0.35, weight: 2, color: '#eab308' }}
                  >
                    <Popup><div className="min-w-[160px] p-1"><p className="font-bold text-sm">{s.road}</p><p className="text-xs">Daily violations: {s.violations}</p></div></Popup>
                  </CircleMarker>
                ))}

                {/* Infrastructure Gap Layer */}
                {layers.infraGaps && INFRA_GAP_DATA.map(ig => (
                  <CircleMarker key={ig.id} center={[ig.lat, ig.lng]} radius={10}
                    pathOptions={{ fillColor: '#8b5cf6', fillOpacity: 0.45, weight: 2, color: '#8b5cf6', dashArray: '2 6' }}
                  >
                    <Popup><div className="min-w-[180px] p-1"><p className="font-bold text-sm">{ig.road}</p><p className="text-xs text-gray-500">Issue: {ig.gap}</p><p className="text-xs">Priority: <strong>{ig.priority}</strong></p></div></Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              {/* Floating Legend */}
              <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 z-[500] shadow-2xl">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Legend</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px]"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-slate-300 font-semibold">Critical Zone</span></div>
                  <div className="flex items-center gap-2 text-[11px]"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-slate-300 font-semibold">High Risk / Blackspot</span></div>
                  <div className="flex items-center gap-2 text-[11px]"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-slate-300 font-semibold">Speed Violation Zone</span></div>
                  <div className="flex items-center gap-2 text-[11px]"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-slate-300 font-semibold">Infrastructure Gap</span></div>
                  <div className="flex items-center gap-2 text-[11px]"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-300 font-semibold">Low / Moderate</span></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
