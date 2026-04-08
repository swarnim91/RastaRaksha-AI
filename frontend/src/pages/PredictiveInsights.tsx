import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrainCircuit, TrendingUp, CloudRain, ThermometerSun, Waves, AlertTriangle, ArrowRight, Zap, MapPin } from 'lucide-react';

const MOCK_PREDICTIONS = [
  { road: "NH-58 Delhi-Meerut Expressway", currentRHI: 34, predictedRHI: 22, degradation: -35, riskFactor: "Monsoon flooding + heavy truck load", timeline: "Next 60 days", severity: "CRITICAL" },
  { road: "GT Karnal Road (NH-44)", currentRHI: 52, predictedRHI: 41, degradation: -21, riskFactor: "Substandard patch material", timeline: "Next 90 days", severity: "HIGH" },
  { road: "Mumbai-Pune Expressway", currentRHI: 48, predictedRHI: 38, degradation: -21, riskFactor: "Ghat section water seepage", timeline: "Next 45 days", severity: "HIGH" },
  { road: "Outer Ring Road (Delhi)", currentRHI: 61, predictedRHI: 55, degradation: -10, riskFactor: "Urban traffic stress", timeline: "Next 120 days", severity: "MEDIUM" },
  { road: "NH-48 Jaipur Highway", currentRHI: 68, predictedRHI: 59, degradation: -13, riskFactor: "Sand erosion near desert stretch", timeline: "Next 90 days", severity: "MEDIUM" },
];

const WEATHER_IMPACT = [
  { season: "Pre-Monsoon (Apr–Jun)", impact: "Thermal expansion cracks", severity: "MEDIUM", icon: <ThermometerSun size={16} className="text-amber-400" /> },
  { season: "Monsoon (Jul–Sep)", impact: "Water seepage & washouts", severity: "CRITICAL", icon: <CloudRain size={16} className="text-blue-400" /> },
  { season: "Post-Monsoon (Oct–Nov)", impact: "Pothole cluster formation", severity: "HIGH", icon: <Waves size={16} className="text-cyan-400" /> },
  { season: "Winter (Dec–Mar)", impact: "Frost heave in North", severity: "MEDIUM", icon: <ThermometerSun size={16} className="text-indigo-400" /> },
];

export default function PredictiveInsights() {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <main className="p-6 flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <BrainCircuit className="text-violet-400" size={24} /> Predictive AI Engine
              <span className="text-[10px] font-black text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 uppercase tracking-[0.15em]">
                ML-Powered
              </span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">AI-driven road degradation forecasts & seasonal risk predictions</p>
          </div>

          {/* Degradation Predictions */}
          <div className="mb-6">
            <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-rose-400" />
              Road Degradation Forecast
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {MOCK_PREDICTIONS.map((pred, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/50 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[14px] font-black text-white group-hover:text-violet-300 transition-colors leading-tight">{pred.road}</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {pred.timeline}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                      pred.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 
                      pred.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>{pred.severity}</span>
                  </div>

                  {/* RHI Visualization */}
                  <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Current RHI</div>
                        <div className="text-xl font-black text-white">{pred.currentRHI}</div>
                      </div>
                      <ArrowRight size={16} className="text-slate-600" />
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Predicted</div>
                        <div className="text-xl font-black text-rose-400">{pred.predictedRHI}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Change</div>
                        <div className="text-lg font-black text-rose-400">{pred.degradation}%</div>
                      </div>
                    </div>
                    {/* Degradation bar */}
                    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-1000" style={{ width: `${pred.currentRHI}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Zap size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{pred.riskFactor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonal Impact Grid */}
          <div className="mb-6">
            <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <CloudRain size={16} className="text-blue-400" />
              Seasonal Risk Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {WEATHER_IMPACT.map((w, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/30">
                      {w.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white">{w.season}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mb-3">{w.impact}</p>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                    w.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' : 
                    w.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>{w.severity} RISK</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Optimization Suggestion */}
          <div className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-indigo-400" />
              AI Budget Recommendation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 text-center">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">₹42.8 Cr</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Estimated Repair Cost</div>
                <div className="text-[10px] text-slate-600 mt-1">For top 10 priority roads</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 text-center">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">₹18.5 Cr</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Pre-Monsoon Budget</div>
                <div className="text-[10px] text-slate-600 mt-1">Preventive maintenance</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 text-center">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">67%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Cost Savings Potential</div>
                <div className="text-[10px] text-slate-600 mt-1">vs reactive maintenance</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
