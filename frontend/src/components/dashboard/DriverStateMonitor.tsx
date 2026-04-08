// Removed unused Eye and Clock icons as per new compact design rules.

interface DriverStateMonitorProps {
  driverState: string;
  earValue: number | null;
}

export default function DriverStateMonitor({ driverState, earValue }: DriverStateMonitorProps) {
  const stateConfig: Record<string, { color: string; label: string }> = {
    ALERT: { color: '#00C853', label: 'ALERT' },
    DROWSY: { color: '#E53935', label: 'DROWSY' },
    YAWNING: { color: '#FF9800', label: 'YAWNING' },
    NO_FACE: { color: '#4A5058', label: 'NO FACE' },
  };

  const cfg = stateConfig[driverState] || stateConfig['NO_FACE'];
  const isDanger = driverState === 'DROWSY' || driverState === 'YAWNING';

  return (
    <div className={`glass-card h-[80px] flex items-center justify-between overflow-hidden transition-colors ${isDanger ? 'bg-rr-red/20 border-rr-red/50' : ''}`}>
      <div className="flex flex-col gap-1">
        <span className="section-title !mb-0">Driver State</span>
        <div className="flex items-center gap-2 px-2 py-0.5 rounded-full border border-current bg-white/5" style={{ color: cfg.color }}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDanger ? 'animate-ping' : ''}`} style={{ backgroundColor: cfg.color }} />
          <span className="text-[10px] font-black uppercase tracking-tight">{cfg.label}</span>
        </div>
      </div>

      <div className="text-right">
        <span className="text-rr-text-muted text-[10px] font-bold uppercase block mb-0.5">EAR</span>
        <span className={`text-2xl font-black tabular-nums leading-none ${earValue !== null && earValue < 0.25 ? 'text-rr-red' : 'text-rr-green'}`}>
          {earValue !== null ? earValue.toFixed(3) : '0.000'}
        </span>
      </div>
    </div>
  );
}
