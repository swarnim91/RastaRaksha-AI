import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface Blackspot {
  id: number;
  name: string;
  lat: number;
  lng: number;
  severity: string;
  state?: string;
  accidents?: number;
}

export default function BlackspotProximity() {
  const [spots, setSpots] = useState<{ name: string; dist: number; severity: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        const res = await fetch('http://127.0.0.1:8000/detect/blackspots');
        const data: Blackspot[] = await res.json();

        const nearby = data
          .map(s => ({
            name: s.name,
            dist: haversine(userLat, userLng, s.lat, s.lng),
            severity: s.severity || 'HIGH',
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);

        setSpots(nearby);
      } catch {
        setSpots([
          { name: 'NH-44 Delhi-Agra', dist: 2.3, severity: 'CRITICAL' },
          { name: 'NH-58 Meerut Highway', dist: 5.1, severity: 'HIGH' },
          { name: 'Ring Road Flyover', dist: 8.7, severity: 'MEDIUM' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
    const iv = setInterval(fetchSpots, 60000);
    return () => clearInterval(iv);
  }, []);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const severityColor: Record<string, string> = {
    CRITICAL: '#E53935',
    HIGH: '#FF5722',
    MEDIUM: '#FF9800',
    LOW: '#FFC107',
  };

  return (
    <div id="blackspot-proximity-card" className="glass-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-rr-red" />
        <h3 className="section-title !mb-0">Blackspots</h3>
      </div>

      <div className="flex-1 space-y-1 overflow-hidden flex flex-col justify-between">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton h-[48px] w-full" />)
        ) : (
          spots.map((spot, i) => {
            const col = severityColor[spot.severity] || '#FF9800';
            return (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-rr-border h-[48px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                  <div className="min-w-0">
                    <p className="text-rr-text text-[11px] font-bold truncate leading-tight">{spot.name}</p>
                    <p className="text-rr-text-muted text-[8px] uppercase tracking-tighter font-black">{spot.severity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span className="text-rr-amber text-[10px] font-black tabular-nums">{spot.dist.toFixed(1)} km</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
