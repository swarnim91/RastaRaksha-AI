import { ShieldCheck } from 'lucide-react';

export default function TacticalOverlay() {
  return (
    <div className="glass-card flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-rr-blue/5 border-rr-blue/20">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-rr-blue/5 animate-pulse" />
      
      {/* Central Icon & Pulse */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-rr-blue/40 rounded-full blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-rr-blue/20 border-2 border-rr-blue/40 flex items-center justify-center">
           <div className="w-3 h-3 bg-rr-blue rounded-full animate-pulse-dot shadow-[0_0_15px_#2196F3]" />
        </div>
      </div>

      {/* Text Info */}
      <div className="text-center z-10">
        <h3 className="text-sm font-black text-rr-text tracking-[0.2em] uppercase mb-1">
          Tactical Overlay Active
        </h3>
        <p className="text-[9px] text-rr-text-muted font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
          Real-time synchronization with MoRTH database. <br />
          All telemetry is encrypted and logged.
        </p>
      </div>

      {/* Decorative Bits */}
      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-1 h-1 bg-rr-blue/30 rounded-full" />
        <div className="w-1 h-1 bg-rr-blue/30 rounded-full" />
      </div>
      <div className="absolute bottom-2 left-2">
        <ShieldCheck className="w-3 h-3 text-rr-blue/40" />
      </div>
    </div>
  );
}
