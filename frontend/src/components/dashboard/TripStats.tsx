// No icons needed as per Rule 3 Section 3

interface TripStatsProps {
  distance: string;
  duration: string;
  potholesAvoided: number;
  safeScore: number;
}

export default function TripStats({ distance, duration, potholesAvoided, safeScore }: TripStatsProps) {
  return (
    <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
      <h3 className="section-title">Trip Statistics</h3>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-2">
        <div className="flex flex-col">
          <span className="label-compact">Distance</span>
          <span className="val-compact text-rr-blue">{distance}</span>
        </div>
        <div className="flex flex-col">
          <span className="label-compact">Duration</span>
          <span className="val-compact text-rr-green">{duration}</span>
        </div>
        <div className="flex flex-col">
          <span className="label-compact">Potholes</span>
          <span className="val-compact text-rr-amber">{potholesAvoided}</span>
        </div>
        <div className="flex flex-col">
          <span className="label-compact">Safe Score</span>
          <span className="val-compact text-rr-green">{safeScore}/100</span>
        </div>
      </div>
    </div>
  );
}

