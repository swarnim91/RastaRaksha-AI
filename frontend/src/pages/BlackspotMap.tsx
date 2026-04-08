import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import HeaderBar from '../components/dashboard/HeaderBar';
import { MapPin, Search, Navigation, Settings, Zap, Target, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Leaflet Icon Fix ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Blackspot {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  accident_count: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

// ─── Map Integration Components ──────────────────────────────────────────────
function MapEvents({ onZoom, onMove, setVisibleCount, spots }: { onZoom: (z: number) => void, onMove: (c: L.LatLng) => void, setVisibleCount: (c: number) => void, spots: Blackspot[] }) {
  const map = useMap();
  
  const update = useCallback(() => {
    onZoom(map.getZoom());
    onMove(map.getCenter());
    const bounds = map.getBounds();
    const visible = spots.filter(s => bounds.contains([s.lat, s.lng])).length;
    setVisibleCount(visible);
  }, [map, onZoom, onMove, setVisibleCount, spots]);

  useMapEvents({
    zoomend: update,
    moveend: update
  });

  useEffect(() => {
    update();
  }, [update]);

  return null;
}

function SyncMiniMap({ center, zoom }: { center: L.LatLngExpression, zoom: number }) {
  const miniMap = useMap();
  useEffect(() => {
    miniMap.setView(center, Math.max(1, zoom - 4), { animate: false });
  }, [center, zoom, miniMap]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BlackspotMap() {
  const [blackspots, setBlackspots] = useState<Blackspot[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [altitude, setAltitude] = useState('--');
  const [accuracy, setAccuracy] = useState('--');
  const [roadStatus, setRoadStatus] = useState('READY');
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [mapZoom, setMapZoom] = useState(5);
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([20.5937, 78.9629]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [routeTrail, setRouteTrail] = useState<[number, number][]>([]);
  
  const [visibleCount, setVisibleCount] = useState(0);
  const [detections, setDetections] = useState({ total: 0, reported: 0, pending: 0, visible: 0 });
  const mapRef = useRef<L.Map | null>(null);
  const startTime = useRef(Date.now());

  // REAL DATA 1: Fetch Blackspots on mount
  useEffect(() => {
    const fetchBlackspots = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/detect/blackspots');
        const data = await res.json();
        const spots = Array.isArray(data) ? data : (data.blackspots || []);
        setBlackspots(spots);
        
        const critical = spots.filter((b: any) => b.severity === 'CRITICAL').length;
        const high = spots.filter((b: any) => b.severity === 'HIGH').length;
        
        setDetections({
          total: spots.length,
          reported: critical,
          pending: high,
          visible: spots.length
        });
      } catch(e) {
        console.error('Blackspots fetch failed:', e);
      }
    };
    fetchBlackspots();
  }, []);

  // REAL DATA 2: GPS WatchPosition
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, altitude: alt, speed: spd, heading: hd, accuracy: acc } = pos.coords;
        
        setUserLocation([latitude, longitude]);
        setSpeed(spd ? Math.round(spd * 3.6) : 0);
        setHeading(hd || 0);
        setAltitude(alt ? Math.round(alt) + 'm' : '--');
        setAccuracy('±' + Math.round(acc) + 'm');
        
        // Nearby status check
        const nearby = blackspots.filter(b => {
          const dist = Math.sqrt(Math.pow(b.lat - latitude, 2) + Math.pow(b.lng - longitude, 2)) * 111;
          return dist < 5;
        }).length;
        
        if (nearby === 0) setRoadStatus('CLEAR');
        else if (nearby <= 2) setRoadStatus('CAUTION');
        else setRoadStatus('HAZARD');
        
        // Tracking trail
        if (isTracking) {
          setRouteTrail(prev => [...prev, [latitude, longitude]]);
        }
        
        // Send to backend
        fetch('http://127.0.0.1:8000/detect/location', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ latitude, longitude })
        }).catch(() => {});
      },
      (err) => console.log('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [blackspots, isTracking]);

  // REAL DATA 3: Session Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setSessionTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // REAL DATA 7: Scan Button Animation
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/detect/blackspots');
      const data = await res.json();
      const allSpots = Array.isArray(data) ? data : (data.blackspots || []);
      setBlackspots([]);
      for (let i = 0; i < allSpots.length; i++) {
        await new Promise(r => setTimeout(r, 100));
        setBlackspots(prev => [...prev, allSpots[i]]);
      }
    } catch(e) { console.error("Scan error", e); }
    setIsScanning(false);
  };

  // REAL DATA 8: Locate Me
  const handleLocate = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 15, { animate: true, duration: 1.5 });
    }
  };

  const getSpeedColor = (s: number) => {
    if (s > 90) return '#E53935';
    if (s > 60) return '#FF9800';
    if (s > 30) return '#2196F3';
    return '#00C853';
  };

  const getCardinal = (angle: number) => {
    const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    return sectors[Math.round(angle / 45)];
  };

  return (
    <div style={{ height: '100vh', background: '#080B0E', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar />

      <style>{`
        .hud-panel {
          background: rgba(16, 20, 25, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px; /* FIX 1 & 2: reduced padding */
          pointer-events: auto;
          flex-shrink: 0;
        }
        .hud-title {
          font-size: 11px;
          color: #8B9299;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: #161B20 !important;
          border: 1px solid rgba(229,57,53,0.3) !important;
          border-radius: 12px !important;
          color: #F5F5F5 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #161B20 !important;
        }
        @media (max-width: 1024px) {
          .hud-sidebar { display: none !important; }
        }
      `}</style>

      {/* TOP HUD BAR */}
      <div style={{ height: '44px', background: 'rgba(16,20,25,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: '8px', height: '8px', background: '#00C853', borderRadius: '50%', boxShadow: '0 0 10px #00C853' }} />
             <span style={{ color: '#00C853', fontSize: '12px', fontWeight: 800 }}>● LIVE</span>
          </div>
          <span style={{ color: '#8B9299', fontSize: '12px', fontWeight: 700, letterSpacing: '2px' }}>RASTA RAKSHA AI — ROAD INTELLIGENCE</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <HUDButton label="Scan Blackspots" icon={<Zap className="w-3.5 h-3.5" />} onClick={handleScan} />
          <HUDButton label="Locate Me" icon={<Target className="w-3.5 h-3.5" />} onClick={handleLocate} />
          <HUDButton label="Track Route" icon={<Navigation className={`w-3.5 h-3.5 ${isTracking ? 'text-rr-red' : ''}`} />} active={isTracking} onClick={() => setIsTracking(!isTracking)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <span style={{ color: '#8B9299', fontSize: '12px' }}>Zoom: {mapZoom}</span>
           <Settings className="w-4 h-4 text-rr-text-muted cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* FIX 5: Main View Height Calc */}
      <main style={{
        display: 'flex',
        height: 'calc(100vh - 110px)',
        background: '#080B0E',
        gap: '8px',
        padding: '8px',
        position: 'relative'
      }}>
        
        {/* FIX 1: LEFT HUD OVERLAY (160px width) */}
        <div className="hud-sidebar" style={{ position: 'absolute', top: 12, left: 12, bottom: 12, width: 160, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', height: '100%', overflow: 'hidden' }}>
           
           {/* PANEL 1: SPEED (150px) */}
           <div className="hud-panel" style={{ height: 150 }}>
              <div className="hud-title">SPEED</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" stroke={getSpeedColor(speed)} strokeWidth="6" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (Math.min(speed, 120) / 120) * 251.2} 
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="55" fontSize="28" fontWeight="900" textAnchor="middle" fill="#F5F5F5">{Math.round(speed)}</text>
                 </svg>
                 <span style={{ fontSize: '12px', color: '#8B9299', fontWeight: 700, marginTop: '-2px' }}>km/h</span>
              </div>
           </div>

           {/* PANEL 2: ROAD STATUS (70px) */}
           <div className="hud-panel" style={{ height: 70 }}>
              <div className="hud-title">ROAD STATUS</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 900, 
                color: roadStatus === 'HAZARD' ? '#E53935' : roadStatus === 'CAUTION' ? '#FF9800' : '#00C853',
                textAlign: 'center'
              }} className={roadStatus === 'HAZARD' ? 'animate-pulse' : ''}>
                {roadStatus}
              </div>
           </div>

           {/* PANEL 3: GPS (110px) */}
           <div className="hud-panel" style={{ height: 110 }}>
              <div className="hud-title">GPS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <TelemetryRow label="LAT" value={userLocation ? userLocation[0].toFixed(4) : '--'} />
                <TelemetryRow label="LON" value={userLocation ? userLocation[1].toFixed(4) : '--'} />
                <TelemetryRow label="ALT" value={altitude} />
              </div>
           </div>

           {/* PANEL 4: MINIMAP (100px min-height added from right sidebar) */}
           <div className="hud-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', minHeight: 120 }}>
              <div className="hud-title" style={{ padding: '6px 8px', marginBottom: 0 }}>OVERVIEW</div>
              <div style={{ height: '100%', position: 'absolute', top: 20, bottom: 0, left: 0, right: 0 }}>
                <MapContainer 
                  center={mapCenter} zoom={Math.max(1, mapZoom - 4)} 
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false} dragging={false} scrollWheelZoom={false} attributionControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <SyncMiniMap center={mapCenter} zoom={mapZoom} />
                </MapContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, pointerEvents: 'none' }}>
                   <div style={{ position: 'relative' }}>
                      <div style={{ width: 15, height: 1, background: '#2196F3' }} />
                      <div style={{ height: 15, width: 1, background: '#2196F3', position: 'absolute', top: -7.5, left: 7.5 }} />
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* FIX 2: RIGHT HUD OVERLAY (180px width) */}
        <div className="hud-sidebar" style={{ position: 'absolute', top: 12, right: 12, bottom: 12, width: 180, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', height: '100%', overflow: 'hidden' }}>
           
           {/* PANEL 1: COMPASS (130px) */}
           <div className="hud-panel" style={{ height: 130 }}>
              <div className="hud-title">COMPASS</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{ 
                   width: 70, height: 70, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%', position: 'relative',
                   transition: 'transform 0.5s ease'
                 }}>
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#8B9299' }}>N</div>
                    <div style={{ 
                      position: 'absolute', top: '50%', left: '50%', width: 2, height: 30, background: '#E53935',
                      transform: `translate(-50%, -100%) rotate(${heading}deg)`,
                      transformOrigin: 'bottom center', transition: 'transform 0.5s ease'
                    }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, background: '#F5F5F5', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
                 </div>
                 <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#F5F5F5' }}>{Math.round(heading)}° {getCardinal(heading)}</span>
                 </div>
              </div>
           </div>

           {/* FIX 4: DETECTION GRID (AUTO height, 2x2 grid) */}
           <div className="hud-panel" style={{ height: 'auto', minHeight: 140 }}>
              <div className="hud-title">DETECTIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
                 <GridStat label="TOTAL" value={detections.total} color="#E53935" />
                 <GridStat label="REPORTED" value={detections.reported} />
                 <GridStat label="PENDING" value={detections.pending} />
                 <GridStat label="VISIBLE" value={visibleCount} />
              </div>
           </div>

            {/* PANEL 3: SESSION (60px) */}
           <div className="hud-panel" style={{ height: 60 }}>
              <div className="hud-title">SESSION</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#2196F3', textAlign: 'center', fontFamily: 'monospace' }}>
                 {sessionTime}
              </div>
           </div>
        </div>

        {/* MAIN FULLSCREEN MAP */}
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CartoDB</a>'
          />
          
          <MapEvents onZoom={setMapZoom} onMove={setMapCenter} setVisibleCount={setVisibleCount} spots={blackspots} />
          
          {isTracking && routeTrail.length > 0 && (
            <Polyline positions={routeTrail} pathOptions={{ color: '#E53935', opacity: 0.6, weight: 4 }} />
          )}

          {blackspots.map((spot) => (
            <Fragment key={spot.id}>
               <CircleMarker center={[spot.lat, spot.lng]} radius={spot.severity === 'CRITICAL' ? 16 : spot.severity === 'HIGH' ? 12 : 8} pathOptions={{ fillColor: spot.severity === 'CRITICAL' ? '#E53935' : spot.severity === 'HIGH' ? '#FF9800' : '#FFC107', fillOpacity: 0.15, weight: 0 }} />
               <CircleMarker center={[spot.lat, spot.lng]} radius={spot.severity === 'CRITICAL' ? 10 : spot.severity === 'HIGH' ? 8 : 5} pathOptions={{ fillColor: spot.severity === 'CRITICAL' ? '#E53935' : spot.severity === 'HIGH' ? '#FF9800' : '#FFC107', fillOpacity: 0.3, weight: 0 }} />
               <CircleMarker 
                 center={[spot.lat, spot.lng]} radius={spot.severity === 'CRITICAL' ? 6 : spot.severity === 'HIGH' ? 4 : 3} 
                 pathOptions={{ fillColor: spot.severity === 'CRITICAL' ? '#E53935' : spot.severity === 'HIGH' ? '#FF9800' : '#FFC107', fillOpacity: 0.9, weight: 2, color: spot.severity === 'CRITICAL' ? '#E53935' : spot.severity === 'HIGH' ? '#FF9800' : '#FFC107' }}
               >
                  <Popup className="dark-popup">
                    <div style={{ minWidth: 200 }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ 
                            background: spot.severity === 'CRITICAL' ? '#E53935' : spot.severity === 'HIGH' ? '#FF9800' : '#FFC107', 
                            color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900 
                          }}>{spot.severity}</span>
                          <span style={{ color: '#8B9299', fontSize: 10, fontWeight: 700 }}>{spot.state} ({spot.accident_count} accidents)</span>
                       </div>
                       <div style={{ fontSize: 14, fontWeight: 900, color: '#F5F5F5', marginBottom: 4 }}>{spot.name}</div>
                       <div style={{ fontSize: 11, color: '#8B9299', marginBottom: 12 }}>{spot.description}</div>
                       <div style={{ display: 'flex', gap: 8 }}>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#E53935', color: 'white', padding: '6px', borderRadius: 6, fontSize: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>🗺️ Navigate</a>
                          <button style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#F5F5F5', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>⚠️ Report to MoRTH</button>
                       </div>
                    </div>
                  </Popup>
               </CircleMarker>
            </Fragment>
          ))}

          {userLocation && (
            <CircleMarker center={userLocation} radius={8} pathOptions={{ fillColor: '#2196F3', fillOpacity: 0.8, color: '#fff', weight: 2 }} />
          )}

        </MapContainer>
      </main>

      {/* BOTTOM HUD BAR */}
      <div style={{ height: '40px', background: 'rgba(16,20,25,0.92)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 1000 }}>
         <div style={{ display: 'flex', gap: '16px' }}>
            <BottomStat label="LAT" value={userLocation ? userLocation[0].toFixed(3) : '--'} />
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
            <BottomStat label="LON" value={userLocation ? userLocation[1].toFixed(3) : '--'} />
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
            <BottomStat label="ZOOM" value={mapZoom} />
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8B9299', fontWeight: 800 }}>HAZARDS:</span>
            <span style={{ fontSize: '14px', color: '#E53935', fontWeight: 900 }}>🔴 {blackspots.filter(b => b.severity === 'CRITICAL').length}</span>
         </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function HUDButton({ label, icon, onClick, active }: { label: string, icon: React.ReactNode, onClick: () => void, active?: boolean }) {
  return (
    <button onClick={onClick} style={{ background: active ? 'rgba(229,57,53,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? '#E53935' : 'rgba(255,255,255,0.08)'}`, borderRadius: '20px', padding: '6px 16px', color: '#F5F5F5', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontWeight: 700 }} onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(229,57,53,0.2)'; e.currentTarget.style.borderColor = '#E53935'; } }} onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}>
      {icon} {label}
    </button>
  );
}

function TelemetryRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 4 }}>
       <span style={{ fontSize: '11px', color: '#8B9299', fontWeight: 700 }}>{label}</span>
       <span style={{ fontSize: '12px', color: '#F5F5F5', fontWeight: 800, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function GridStat({ label, value, color = "#F5F5F5" }: { label: string, value: number, color?: string }) {
  return (
    <div style={{ background: '#0D1117', padding: '6px', borderRadius: '8px', textAlign: 'center', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
       <div style={{ fontSize: '11px', color: '#8B9299', fontWeight: 800, marginBottom: 2 }}>{label}</div>
       <div style={{ fontSize: '20px', fontWeight: 900, color: color }}>{value}</div>
    </div>
  );
}

function BottomStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
       <span style={{ fontSize: '11px', color: '#8B9299', fontWeight: 800 }}>{label}:</span>
       <span style={{ fontSize: '12px', color: '#F5F5F5', fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
