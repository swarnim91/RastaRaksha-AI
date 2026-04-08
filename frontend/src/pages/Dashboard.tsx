import { useState, useCallback, useEffect } from 'react';
import HeaderBar from '../components/dashboard/HeaderBar';
import CriticalAlertBanner from '../components/dashboard/CriticalAlertBanner';
import RiskGauge from '../components/dashboard/RiskGauge';
import DriverStateMonitor from '../components/dashboard/DriverStateMonitor';
import TripStats from '../components/dashboard/TripStats';
import LiveCameraCard, { CameraAlert } from '../components/dashboard/LiveCameraCard';
import AlertTimeline, { TimelineAlert } from '../components/dashboard/AlertTimeline';
import BlackspotProximity from '../components/dashboard/BlackspotProximity';
import AISafetyInsight from '../components/dashboard/AISafetyInsight';
import QuickStats from '../components/dashboard/QuickStats';
import TacticalOverlay from '../components/dashboard/TacticalOverlay';
import WeeklyTrend from '../components/dashboard/WeeklyTrend';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<TimelineAlert[]>([]);
  const [criticalAlert, setCriticalAlert] = useState<{ msg: string; hi: string } | null>(null);
  const [driverState, setDriverState] = useState('--');
  const [earValue, setEarValue] = useState<number | null>(null);

  // Live Trip tracking state
  const [tripDistance, setTripDistance] = useState(0.0);
  const [tripDuration, setTripDuration] = useState(0); 
  const [potholesAvoided, setPotholesAvoided] = useState(0);
  const [safeScore, setSafeScore] = useState(100);

  // Fetch true stats
  useEffect(() => {
    fetch('http://127.0.0.1:8000/reports/summary')
      .then(res => res.json())
      .then(data => {
        setTripDistance(data.total_distance || 0.0);
        setPotholesAvoided(data.alert_breakdown?.pothole || 0);
        setSafeScore(data.avg_risk_score || 100);
        setTripDuration((data.total_trips || 0) * 1800); // Assuming 30m per trip
      })
      .catch(err => console.error("Error fetching trip stats:", err));
  }, []);

  // Fetch true alert history from backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/reports/recent-alerts')
      .then(res => res.json())
      .then(data => {
        if (data.alerts) setAlerts(data.alerts);
      })
      .catch(err => console.error("Error fetching recent alerts:", err));
  }, []);

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs % 60}s`;
  };

  const handleDetection = useCallback((alert: CameraAlert) => {
    const newAlert: TimelineAlert = {
      id: alert.id,
      type: alert.type,
      hindi_text: alert.hindi_text,
      severity: alert.severity,
      timestamp: alert.timestamp,
      confidence: alert.confidence,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    
    // Update live metrics based on real detections
    if (alert.type === 'pothole') {
      setPotholesAvoided(prev => prev + 1);
    }
    if (alert.severity === 'HIGH') {
      setSafeScore(prev => Math.max(10, prev - 2));
    }

    if (alert.severity === 'HIGH') {
      setCriticalAlert({ msg: `${alert.type.toUpperCase()} DETECTED`, hi: alert.hindi_text || 'पीछे रहें!' });
    }
  }, []);

  const handleDriverState = useCallback((state: string, ear: number | null, hindi: string) => {
    setDriverState(state);
    setEarValue(ear);
    if (state === 'DROWSY') {
      setCriticalAlert({ msg: 'DROWSINESS DETECTED', hi: hindi || 'नींद आ रही है! कृपया जगे रहें' });
      setSafeScore(prev => Math.max(10, prev - 5));
      setAlerts(prev => [{
        id: Date.now().toString(),
        type: 'drowsiness',
        hindi_text: hindi || 'नींद आ रही है!',
        severity: 'HIGH' as const,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        confidence: 0.9,
      }, ...prev].slice(0, 50));
    }
  }, []);

  return (
    <div className="min-h-screen bg-rr-bg flex flex-col dashboard-scroll-area">
      <HeaderBar />
      <CriticalAlertBanner
        message={criticalAlert?.msg ?? null}
        hindiMessage={criticalAlert?.hi ?? null}
        onDismiss={() => setCriticalAlert(null)}
      />

      <main className="flex-1 p-4 w-full flex justify-center">
        {/* NEW SCROLLABLE LAYOUT: Split Top / Bottom cleanly to prevent ANY unwanted space and guarantee alignment */}
        <div className="flex flex-col gap-4 w-full max-w-[1600px]">

          {/* ===== TOP SECTION: 3 Columns ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4 w-full min-h-[560px]">
            
            {/* COLUMN 1 */}
            <div className="flex flex-col gap-4">
              <div className="shrink-0"><RiskGauge /></div>
              <div className="shrink-0"><DriverStateMonitor driverState={driverState} earValue={earValue} /></div>
              <div className="flex-1 min-h-[140px] flex flex-col">
                <TripStats 
                  distance={`${tripDistance.toFixed(1)} km`} 
                  duration={formatDuration(tripDuration)} 
                  potholesAvoided={potholesAvoided} 
                  safeScore={safeScore} 
                />
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="flex flex-col gap-4 order-first lg:order-none">
              <div className="flex-1 min-h-[300px] flex flex-col">
                <LiveCameraCard onDetection={handleDetection} onDriverStateChange={handleDriverState} />
              </div>
              <div className="h-[60px] shrink-0">
                <QuickStats />
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="flex flex-col gap-4">
              <div className="shrink-0"><BlackspotProximity /></div>
              <div className="shrink-0"><AISafetyInsight /></div>
              <div className="flex-1 min-h-[140px] flex flex-col">
                <TacticalOverlay />
              </div>
            </div>

          </div>

          {/* ===== BOTTOM SECTION: Full width span, 70/30 Split ===== */}
          <div className="flex flex-col lg:flex-row gap-4 w-full h-auto lg:h-[360px]">
             {/* 70% Width graph */}
            <div className="flex-[7] min-h-[300px] lg:min-h-0 min-w-0 h-full flex flex-col">
              <WeeklyTrend />
            </div>
             {/* 30% Width alerts */}
            <div className="flex-[3] min-h-[300px] lg:min-h-0 min-w-0 h-full flex flex-col">
              <AlertTimeline alerts={alerts} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
