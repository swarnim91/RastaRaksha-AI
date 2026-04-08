import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  BarChart3, Download, FileText, TrendingUp, TrendingDown, 
  AlertTriangle, ShieldCheck, Clock, MapPin, Filter, 
  ChevronDown, CheckCircle2, Printer, Eye, Building2, 
  CalendarDays, Landmark, FileSpreadsheet, BrainCircuit
} from 'lucide-react';

/* ── Mock Data ─────────────────────────────────── */
const WEEKLY_SCORES = [
  { day: 'Mon', score: 72, potholes: 42, incidents: 3 },
  { day: 'Tue', score: 68, potholes: 51, incidents: 5 },
  { day: 'Wed', score: 81, potholes: 28, incidents: 1 },
  { day: 'Thu', score: 64, potholes: 63, incidents: 7 },
  { day: 'Fri', score: 77, potholes: 35, incidents: 2 },
  { day: 'Sat', score: 83, potholes: 19, incidents: 0 },
  { day: 'Sun', score: 88, potholes: 12, incidents: 1 },
];

const ALERT_BREAKDOWN = [
  { type: 'Pothole Clusters', count: 432, total: 1432, color: 'rose', icon: <AlertTriangle size={14} /> },
  { type: 'Speed Violations', count: 412, total: 1432, color: 'amber', icon: <TrendingUp size={14} /> },
  { type: 'Accident Blackspots', count: 84, total: 1432, color: 'orange', icon: <MapPin size={14} /> },
  { type: 'Infrastructure Gaps', count: 47, total: 1432, color: 'violet', icon: <Building2 size={14} /> },
];

const DISTRICT_REPORTS = [
  { district: "Central Delhi", rhi: 52, potholes: 142, blackspots: 8, repairs: 34, budget: "₹4.2 Cr", status: "Critical", complianceScore: 45 },
  { district: "North Delhi", rhi: 41, potholes: 186, blackspots: 12, repairs: 18, budget: "₹6.8 Cr", status: "Critical", complianceScore: 32 },
  { district: "South Delhi", rhi: 68, potholes: 98, blackspots: 5, repairs: 67, budget: "₹3.1 Cr", status: "Moderate", complianceScore: 71 },
  { district: "East Delhi", rhi: 71, potholes: 73, blackspots: 4, repairs: 58, budget: "₹2.4 Cr", status: "Good", complianceScore: 78 },
  { district: "Gurugram", rhi: 74, potholes: 64, blackspots: 6, repairs: 49, budget: "₹2.9 Cr", status: "Good", complianceScore: 82 },
  { district: "Noida", rhi: 63, potholes: 89, blackspots: 7, repairs: 41, budget: "₹3.5 Cr", status: "Moderate", complianceScore: 64 },
  { district: "Faridabad", rhi: 48, potholes: 112, blackspots: 9, repairs: 22, budget: "₹5.1 Cr", status: "Critical", complianceScore: 38 },
  { district: "Ghaziabad", rhi: 59, potholes: 95, blackspots: 6, repairs: 35, budget: "₹3.8 Cr", status: "Moderate", complianceScore: 55 },
];

const RTI_REQUESTS = [
  { id: "RTI-2026-0412", subject: "NH-58 Repair Status under PMGSY", filed: "2026-03-28", status: "Auto-Generated", ministry: "MoRTH" },
  { id: "RTI-2026-0398", subject: "Blackspot Lighting Budget — Delhi NCR", filed: "2026-03-25", status: "Responded", ministry: "MoHUA" },
  { id: "RTI-2026-0384", subject: "Contractor Performance Audit — Zone 4", filed: "2026-03-20", status: "Auto-Generated", ministry: "NHAI" },
  { id: "RTI-2026-0371", subject: "Road Fatality Data — Q1 2026", filed: "2026-03-15", status: "Pending", ministry: "MoRTH" },
];

const AUDIT_TRAIL = [
  { timestamp: "2026-04-07 23:45:12", user: "IAS_Admin_L5", action: "Generated District Report", resource: "North Delhi Zone", ip: "10.0.42.xx" },
  { timestamp: "2026-04-07 22:18:05", user: "Analyst_L3", action: "Exported PDF", resource: "Weekly Safety Brief", ip: "10.0.42.xx" },
  { timestamp: "2026-04-07 20:33:48", user: "IAS_Admin_L5", action: "Modified Priority", resource: "NH-58 Repair Task", ip: "10.0.42.xx" },
  { timestamp: "2026-04-07 18:12:30", user: "System", action: "Auto-Alert Dispatch", resource: "Emergency #101", ip: "System" },
  { timestamp: "2026-04-07 15:05:22", user: "Analyst_L3", action: "Viewed Predictions", resource: "Monsoon Forecast", ip: "10.0.42.xx" },
];

type TabKey = 'overview' | 'district' | 'compliance' | 'audit';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [timeRange, setTimeRange] = useState('7d');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Executive Overview', icon: <BarChart3 size={14} /> },
    { key: 'district', label: 'District-Wise Report', icon: <Building2 size={14} /> },
    { key: 'compliance', label: 'RTI & Compliance', icon: <Landmark size={14} /> },
    { key: 'audit', label: 'Audit Trail', icon: <Eye size={14} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        
        <main className="p-6 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="text-indigo-400" size={24} />
                Intelligence Reports
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">Government-grade analytics, compliance tracking & automated reporting</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-slate-800/40 border border-slate-700/40 rounded-xl p-1">
                {['24h', '7d', '30d', '90d'].map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      timeRange === r ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-slate-500 hover:text-white'
                    }`}
                  >{r}</button>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                <Download size={14} /> Export PDF
              </button>
              <button className="p-2.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-slate-400 hover:text-white transition-colors">
                <Printer size={16} />
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-2 mb-6 border-b border-slate-800/60 pb-3">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  activeTab === t.key
                    ? 'bg-slate-700/40 text-white border-slate-600'
                    : 'text-slate-500 border-transparent hover:text-white hover:bg-slate-800/40'
                }`}
              >{t.icon} {t.label}</button>
            ))}
          </div>

          {/* ═══ TAB: EXECUTIVE OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Weekly Score Chart */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-8 bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-400" /> Weekly Road Health Trend
                    </h2>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">Last 7 Days</span>
                  </div>
                  <div className="h-52 flex items-end gap-3">
                    {WEEKLY_SCORES.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">{item.score}</span>
                        <div className="w-full rounded-t-lg transition-all duration-500 hover:scale-[1.05] relative"
                          style={{
                            height: `${(item.score / 100) * 180}px`,
                            background: item.score > 75 ? 'linear-gradient(to top, #10b981, #34d399)' :
                                       item.score > 60 ? 'linear-gradient(to top, #f59e0b, #fbbf24)' :
                                       'linear-gradient(to top, #ef4444, #f87171)',
                            boxShadow: item.score > 75 ? '0 0 20px rgba(16,185,129,0.2)' : item.score > 60 ? '0 0 20px rgba(245,158,11,0.2)' : '0 0 20px rgba(239,68,68,0.2)'
                          }}
                        />
                        <span className="text-[10px] text-slate-500 font-bold">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert Breakdown */}
                <div className="col-span-12 lg:col-span-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
                  <h2 className="text-sm font-black text-white mb-5 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-400" /> Issue Distribution
                  </h2>
                  <div className="space-y-4">
                    {ALERT_BREAKDOWN.map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                            {item.icon} {item.type}
                          </span>
                          <span className="text-xs font-black text-white">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 transition-all duration-1000`}
                            style={{ width: `${(item.count / (ALERT_BREAKDOWN.reduce((a, b) => a + b.count, 0))) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Total Issues</span>
                      <span className="text-lg font-black text-white">{ALERT_BREAKDOWN.reduce((a, b) => a + b.count, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Generated Brief */}
              <div className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <BrainCircuit size={16} className="text-violet-400" /> AI Executive Brief
                  </h2>
                  <span className="text-[9px] font-black text-violet-300 bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20 uppercase tracking-wider">Auto-Generated</span>
                </div>
                <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-700/30">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    Delhi NCR road network shows a <strong className="text-amber-400">12% deterioration</strong> in the Road Health Index (RHI) compared to last quarter, 
                    primarily driven by monsoon damage on NH-58 and GT Karnal Road corridors. North Delhi and Faridabad districts have fallen below the 
                    <strong className="text-rose-400"> critical threshold (RHI &lt; 50)</strong>, requiring immediate budget allocation of approximately ₹11.9 Cr 
                    for emergency repairs. Positive note: South Delhi and Gurugram districts show <strong className="text-emerald-400">consistent improvement</strong> 
                    due to proactive maintenance under the PMGSY scheme. Speed violation hotspots on Outer Ring Road and DND Flyway require immediate camera enforcement deployment.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-700/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Generated from 2,847 km road network analysis · Last refreshed 3m ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: DISTRICT-WISE ═══ */}
          {activeTab === 'district' && (
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/50 flex items-center justify-between">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <Building2 size={16} className="text-amber-400" /> District Performance Matrix — Delhi NCR
                </h2>
                <button className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-300 transition-colors">
                  <FileSpreadsheet size={13} /> Export to Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-700/40">
                      <th className="px-6 py-3">District</th>
                      <th className="px-6 py-3">RHI Score</th>
                      <th className="px-6 py-3">Potholes</th>
                      <th className="px-6 py-3">Blackspots</th>
                      <th className="px-6 py-3">Repairs Done</th>
                      <th className="px-6 py-3">Est. Budget</th>
                      <th className="px-6 py-3">Compliance</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISTRICT_REPORTS.map((d, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3.5 text-white text-xs font-bold">{d.district}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${d.rhi < 50 ? 'text-rose-400' : d.rhi < 65 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.rhi}</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full ${d.rhi < 50 ? 'bg-rose-500' : d.rhi < 65 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${d.rhi}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-300 text-xs font-bold">{d.potholes}</td>
                        <td className="px-6 py-3.5 text-slate-300 text-xs font-bold">{d.blackspots}</td>
                        <td className="px-6 py-3.5 text-emerald-400 text-xs font-bold">{d.repairs}</td>
                        <td className="px-6 py-3.5 text-white text-xs font-bold">{d.budget}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${d.complianceScore < 50 ? 'text-rose-400' : d.complianceScore < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.complianceScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            d.status === 'Critical' ? 'bg-rose-500/10 text-rose-400' :
                            d.status === 'Moderate' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TAB: RTI & COMPLIANCE ═══ */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">4</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">RTI Auto-Generated</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">This quarter</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-emerald-400">100%</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Data Encryption</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">AES-256 Active</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-amber-400">3</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Active Roles</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">Admin · Officer · Analyst</div>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/50 flex items-center justify-between">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Landmark size={16} className="text-indigo-400" /> Auto-Generated RTI & PMGSY Reports
                  </h2>
                  <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 uppercase tracking-wider">
                    MoRTH Compliant
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-700/40">
                        <th className="px-6 py-3">Reference ID</th>
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3">Filed Date</th>
                        <th className="px-6 py-3">Ministry / Agency</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RTI_REQUESTS.map((r, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3.5 text-indigo-300 text-xs font-bold font-mono">{r.id}</td>
                          <td className="px-6 py-3.5 text-white text-xs font-bold">{r.subject}</td>
                          <td className="px-6 py-3.5 text-slate-400 text-xs font-semibold">{r.filed}</td>
                          <td className="px-6 py-3.5">
                            <span className="text-[10px] font-black text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">{r.ministry}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                              r.status === 'Auto-Generated' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                              r.status === 'Responded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: AUDIT TRAIL ═══ */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Government Compliance — Audit Log</h3>
                    <p className="text-[10px] text-slate-500 font-bold">All user actions are encrypted & logged per IT Act 2000 Section 43A</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-wider">
                  <CheckCircle2 size={12} className="inline mr-1.5" />AES-256 Active
                </span>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/50 flex items-center justify-between">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Eye size={16} className="text-cyan-400" /> Activity Log
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500">{AUDIT_TRAIL.length} entries</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {AUDIT_TRAIL.map((entry, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-900/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                        <Clock size={14} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black text-white">{entry.action}</span>
                          <span className="text-[9px] text-slate-600">→</span>
                          <span className="text-xs font-semibold text-slate-400">{entry.resource}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                          <span className="font-mono">{entry.timestamp}</span>
                          <span>·</span>
                          <span className={`font-bold ${entry.user === 'System' ? 'text-cyan-400' : 'text-slate-400'}`}>{entry.user}</span>
                          <span>·</span>
                          <span className="font-mono">{entry.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
