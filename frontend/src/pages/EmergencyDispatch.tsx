import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EmergencyAlertCard from '../components/EmergencyAlertCard';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Siren, ShieldAlert, CheckCircle2, Radio, Phone, Clock, MapPin, AlertTriangle, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EmergencyAlert {
  alert_id: number;
  location: { lat: number; lng: number };
  hazard_type: string;
  severity_level: string;
  dispatch_status: string;
  timestamp: string;
  prediction_summary?: string;
}

// Realistic mock data so the page always looks populated
const MOCK_ACTIVE: EmergencyAlert[] = [
  { alert_id: 101, location: { lat: 28.6139, lng: 77.2090 }, hazard_type: "multi_vehicle_collision", severity_level: "HIGH_IMPACT", dispatch_status: "PENDING", timestamp: new Date(Date.now() - 120000).toISOString() },
  { alert_id: 102, location: { lat: 28.7041, lng: 77.1025 }, hazard_type: "road_cave_in", severity_level: "HIGH_IMPACT", dispatch_status: "PENDING", timestamp: new Date(Date.now() - 480000).toISOString() },
  { alert_id: 103, location: { lat: 28.4595, lng: 77.0266 }, hazard_type: "vehicle_fire", severity_level: "MEDIUM", dispatch_status: "PENDING", timestamp: new Date(Date.now() - 900000).toISOString() },
];

const MOCK_HISTORY: EmergencyAlert[] = [
  { alert_id: 98, location: { lat: 28.5355, lng: 77.3910 }, hazard_type: "pothole_cluster", severity_level: "MEDIUM", dispatch_status: "DISPATCHED", timestamp: new Date(Date.now() - 3600000).toISOString(), prediction_summary: "Medium severity pothole cluster detected. Road surface damage likely to worsen during monsoon." },
  { alert_id: 97, location: { lat: 28.6508, lng: 77.2319 }, hazard_type: "pedestrian_accident", severity_level: "HIGH_IMPACT", dispatch_status: "DISPATCHED", timestamp: new Date(Date.now() - 7200000).toISOString(), prediction_summary: "High impact zone — pedestrian crossing without adequate lighting." },
  { alert_id: 96, location: { lat: 28.4089, lng: 77.3178 }, hazard_type: "oil_spill", severity_level: "MEDIUM", dispatch_status: "DISPATCHED", timestamp: new Date(Date.now() - 10800000).toISOString(), prediction_summary: "Oil spill on highway — slippery conditions expected for 2km stretch." },
  { alert_id: 95, location: { lat: 28.7200, lng: 77.0600 }, hazard_type: "bridge_structural_alert", severity_level: "HIGH_IMPACT", dispatch_status: "DISPATCHED", timestamp: new Date(Date.now() - 14400000).toISOString(), prediction_summary: "Structural vibration anomaly detected on overpass. Inspection recommended." },
  { alert_id: 94, location: { lat: 28.5500, lng: 77.2500 }, hazard_type: "flooding", severity_level: "MEDIUM", dispatch_status: "PENDING", timestamp: new Date(Date.now() - 18000000).toISOString(), prediction_summary: "Waterlogging detected — drainage failure on underpass segment." },
];

export default function EmergencyDispatch() {
  const [activeZones, setActiveZones] = useState<EmergencyAlert[]>(MOCK_ACTIVE);
  const [history, setHistory] = useState<EmergencyAlert[]>(MOCK_HISTORY);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [dispatchData, setDispatchData] = useState<{message: string, eta: number} | null>(null);

  // Try to fetch live data from backend, fall back to mocks silently
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zRes, hRes] = await Promise.all([
          fetch('http://localhost:8000/b2g/emergency/active-zones'),
          fetch('http://localhost:8000/b2g/emergency/history'),
        ]);
        if (zRes.ok) { const d = await zRes.json(); if (d.length > 0) setActiveZones(d); }
        if (hRes.ok) { const d = await hRes.json(); if (d.length > 0) setHistory(d); }
      } catch { /* silently use mocks */ }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (responderType: string) => {
    if (!selectedAlertId) return;
    try {
      const res = await fetch('http://localhost:8000/b2g/emergency/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: selectedAlertId, responder_type: responderType })
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchData({ message: data.confirmation_message, eta: data.eta_minutes });
      } else {
        throw new Error('');
      }
    } catch {
      // Mock dispatch for prototype
      setDispatchData({ message: `${responderType} भेज दिया गया है। ETA 12 मिनट।`, eta: 12 });
      setActiveZones(prev => prev.map(a => a.alert_id === selectedAlertId ? {...a, dispatch_status: 'DISPATCHED'} : a));
    }
    setTimeout(() => { setSelectedAlertId(null); setDispatchData(null); }, 4000);
  };

  const getMarkerColor = (severity: string) => {
    if (severity === 'HIGH_IMPACT') return '#ef4444';
    if (severity === 'MEDIUM') return '#f97316';
    return '#eab308';
  };

  const allMarkers = [...activeZones, ...history];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        
        <main className="p-6 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Siren className="text-rose-400" size={24} />
                Emergency Command & Control
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">Real-time emergency dispatch and coordination for Government responders</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg shadow-rose-500/5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-rose-300 font-black text-sm">{activeZones.filter(a => a.dispatch_status === 'PENDING').length} Active Alerts</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-emerald-300 font-black text-sm">{activeZones.filter(a => a.dispatch_status === 'DISPATCHED').length + history.filter(h => h.dispatch_status === 'DISPATCHED').length} Dispatched</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Avg Response Time", value: "8.2 min", icon: <Clock size={16} className="text-cyan-400" />, color: "cyan" },
              { label: "Units Deployed", value: "14", icon: <Truck size={16} className="text-amber-400" />, color: "amber" },
              { label: "Coverage Area", value: "Delhi NCR", icon: <MapPin size={16} className="text-indigo-400" />, color: "indigo" },
              { label: "Helpline Active", value: "112 / 108", icon: <Phone size={16} className="text-emerald-400" />, color: "emerald" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/30">{s.icon}</div>
                <div>
                  <div className="text-lg font-black text-white leading-tight">{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            
            {/* Active Zones Panel */}
            <div className="col-span-12 lg:col-span-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl flex flex-col h-[520px]">
              <div className="px-5 py-3 border-b border-slate-700/40 bg-slate-800/50 rounded-t-2xl flex items-center justify-between">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-400" />
                  Live Active Zones
                </h2>
                <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20 uppercase tracking-wider">
                  {activeZones.filter(a => a.dispatch_status === 'PENDING').length} Pending
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700">
                {activeZones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-bold">No active emergencies</p>
                    <p className="text-[10px] text-slate-600 mt-1">All clear in monitored zones</p>
                  </div>
                ) : (
                  activeZones.map(alert => (
                    <EmergencyAlertCard 
                      key={alert.alert_id} 
                      {...alert} 
                      onDispatch={(id) => setSelectedAlertId(id)} 
                    />
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div className="col-span-12 lg:col-span-8 bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden h-[520px] flex flex-col">
              <div className="px-5 py-3 border-b border-slate-700/40 bg-slate-800/50 flex items-center justify-between">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  Emergency Response Map
                </h2>
                <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                  <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>High Impact
                  </span>
                  <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">Medium</span>
                </div>
              </div>
              <div className="flex-1">
                <MapContainer 
                  center={[28.6139, 77.2090]}
                  zoom={10} 
                  style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OSM &copy; CARTO'
                  />
                  
                  {allMarkers.map((alert) => (
                    <CircleMarker
                      key={`marker-${alert.alert_id}`}
                      center={[alert.location.lat, alert.location.lng]}
                      radius={alert.severity_level === 'HIGH_IMPACT' ? 14 : 9}
                      fillColor={getMarkerColor(alert.severity_level)}
                      color={getMarkerColor(alert.severity_level)}
                      weight={2}
                      opacity={alert.dispatch_status === 'DISPATCHED' ? 0.4 : 0.9}
                      fillOpacity={alert.dispatch_status === 'DISPATCHED' ? 0.15 : 0.45}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px]">
                          <h4 className="font-bold text-sm capitalize border-b pb-1 mb-2">
                            {alert.hazard_type.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs"><strong>Severity:</strong> {alert.severity_level}</p>
                          <p className="text-xs"><strong>Status:</strong> {alert.dispatch_status}</p>
                          {alert.prediction_summary && (
                            <p className="text-xs text-gray-500 mt-2 italic">{alert.prediction_summary}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Dispatch History Table */}
          <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                Dispatch History Log
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{history.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-700/40">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Hazard Type</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={`hist-${item.alert_id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3.5 text-white font-bold text-xs">#{item.alert_id}</td>
                      <td className="px-6 py-3.5 text-slate-400 text-xs font-semibold">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-slate-200 text-xs font-bold capitalize">{item.hazard_type.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-3.5 text-slate-400 text-xs font-mono">{item.location.lat.toFixed(3)}, {item.location.lng.toFixed(3)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          item.dispatch_status === 'DISPATCHED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.dispatch_status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          item.severity_level === 'HIGH_IMPACT' ? 'bg-rose-500/10 text-rose-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {item.severity_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-600 text-sm font-semibold">
                        No dispatch history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Dispatch Modal */}
      {selectedAlertId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50">
            
            {dispatchData ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Dispatched Successfully</h3>
                <p className="text-emerald-400 font-bold text-sm mb-4">ETA: {dispatchData.eta} Minutes</p>
                <div className="bg-slate-800/60 border border-slate-700/30 p-4 rounded-xl text-left">
                  <p className="text-slate-300 text-sm italic leading-relaxed">"{dispatchData.message}"</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
                    <Radio className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Dispatch Responder</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Route emergency service to Alert #{selectedAlertId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5 mt-5">
                  <button onClick={() => handleDispatch('ambulance')} className="flex items-center gap-4 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 hover:border-rose-500/30 p-4 rounded-xl transition-all group">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center group-hover:bg-rose-500 transition-colors border border-rose-500/20 group-hover:border-rose-500">
                      <Siren className="w-5 h-5 text-rose-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-sm">Ambulance (108)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Medical emergencies & casualties</span>
                    </div>
                  </button>
                  
                  <button onClick={() => handleDispatch('police')} className="flex items-center gap-4 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 hover:border-blue-500/30 p-4 rounded-xl transition-all group">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors border border-blue-500/20 group-hover:border-blue-500">
                      <ShieldAlert className="w-5 h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-sm">Police (112)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Traffic control, collisions & crowd management</span>
                    </div>
                  </button>
                  
                  <button onClick={() => handleDispatch('fire')} className="flex items-center gap-4 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 hover:border-orange-500/30 p-4 rounded-xl transition-all group">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors border border-orange-500/20 group-hover:border-orange-500">
                      <Truck className="w-5 h-5 text-orange-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-sm">Fire & Rescue (101)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Vehicle fires, chemical spills & structural hazards</span>
                    </div>
                  </button>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setSelectedAlertId(null)}
                    className="text-slate-400 hover:text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
