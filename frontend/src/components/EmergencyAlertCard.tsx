import { AlertTriangle, Clock, MapPin, Truck, Radio } from 'lucide-react';

interface EmergencyAlertCardProps {
  alert_id: number;
  location: { lat: number; lng: number };
  hazard_type: string;
  severity_level: string;
  dispatch_status: string;
  timestamp: string;
  onDispatch: (id: number) => void;
}

export default function EmergencyAlertCard({
  alert_id,
  location,
  hazard_type,
  severity_level,
  dispatch_status,
  timestamp,
  onDispatch,
}: EmergencyAlertCardProps) {
  const isHigh = severity_level === 'HIGH_IMPACT';
  const isDispatched = dispatch_status === 'DISPATCHED';

  return (
    <div className={`bg-slate-900/60 rounded-xl p-4 mb-3 border transition-all duration-300 hover:bg-slate-800/60 group ${
      isHigh && !isDispatched 
        ? 'border-rose-500/40 shadow-lg shadow-rose-500/10' 
        : isDispatched 
          ? 'border-emerald-500/30' 
          : 'border-slate-700/40'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isHigh ? 'bg-rose-500/15' : 'bg-orange-500/15'
          }`}>
            <AlertTriangle className={`w-4 h-4 ${isHigh ? 'text-rose-400' : 'text-orange-400'}`} />
          </div>
          <div>
            <h3 className="text-[13px] font-black text-white capitalize leading-tight">{hazard_type.replace('_', ' ')}</h3>
            <span className="text-[10px] text-slate-500 font-bold">Alert #{alert_id}</span>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
          isHigh ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        }`}>
          {severity_level}
        </span>
      </div>
      
      <div className="space-y-1.5 mt-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold">{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/30">
        {isDispatched ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
            <Truck className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Responders En Route</span>
          </div>
        ) : (
          <button
            onClick={() => onDispatch(alert_id)}
            className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Radio className="w-3.5 h-3.5" /> Dispatch Now
          </button>
        )}
      </div>
    </div>
  );
}
