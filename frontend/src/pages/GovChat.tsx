import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Send, BrainCircuit, Sparkles, 
  BarChart3, MapPin, AlertTriangle, Building2, Wrench, 
  Download, Copy, CheckCircle2, ShieldCheck, Lock,
  FileText, TrendingUp, Zap, CircleDot
} from 'lucide-react';

/* ── Types ─────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  dataCard?: DataCard;
  tableData?: TableRow[];
  classification?: 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL';
}

interface DataCard {
  title: string;
  stats: { label: string; value: string; trend?: string; trendUp?: boolean }[];
}

interface TableRow {
  [key: string]: string | number;
}

/* ── Pre-built Government Queries ──────────────── */
const QUICK_QUERIES = [
  { icon: <AlertTriangle size={13} />, label: "Top 10 worst roads by RHI", category: "Critical" },
  { icon: <Building2 size={13} />, label: "District-wise pothole summary", category: "Analysis" },
  { icon: <Wrench size={13} />, label: "Overdue contractor tasks", category: "Operations" },
  { icon: <BarChart3 size={13} />, label: "Weekly safety trend report", category: "Reports" },
  { icon: <MapPin size={13} />, label: "Blackspot clusters near schools", category: "Critical" },
  { icon: <TrendingUp size={13} />, label: "Pre-monsoon budget forecast", category: "Finance" },
  { icon: <Zap size={13} />, label: "Speed violation hotspot analysis", category: "Analysis" },
  { icon: <CircleDot size={13} />, label: "Infrastructure gap audit — Zone 4", category: "Audit" },
];

/* ── AI Response Simulator ─────────────────────── */
function generateMockResponse(query: string): Omit<ChatMessage, 'id' | 'timestamp'> {
  const q = query.toLowerCase();

  if (q.includes('worst') || q.includes('rhi') || q.includes('top')) {
    return {
      role: 'assistant',
      content: "Here are the **Top 10 roads with the lowest Road Health Index (RHI)** in Delhi NCR, ranked by criticality. These roads require immediate budgetary intervention under the PMGSY scheme.",
      classification: 'RESTRICTED',
      tableData: [
        { Rank: 1, Road: "NH-58 Delhi-Meerut", District: "North Delhi", RHI: 28, Potholes: 186, "Est. Cost": "₹6.8 Cr" },
        { Rank: 2, Road: "GT Karnal Road NH-44", District: "North Delhi", RHI: 31, Potholes: 164, "Est. Cost": "₹5.9 Cr" },
        { Rank: 3, Road: "Faridabad-Ballabgarh", District: "Faridabad", RHI: 34, Potholes: 142, "Est. Cost": "₹5.1 Cr" },
        { Rank: 4, Road: "ITO Flyover Stretch", District: "Central Delhi", RHI: 38, Potholes: 98, "Est. Cost": "₹4.2 Cr" },
        { Rank: 5, Road: "Outer Ring Road", District: "South Delhi", RHI: 42, Potholes: 87, "Est. Cost": "₹3.8 Cr" },
      ],
    };
  }

  if (q.includes('district') || q.includes('pothole') || q.includes('summary')) {
    return {
      role: 'assistant',
      content: "Here is the **District-wise Pothole Intelligence Summary** for Delhi NCR. North Delhi and Faridabad are flagged as critical with compliance scores below the mandated threshold.",
      classification: 'UNCLASSIFIED',
      dataCard: {
        title: "Pothole Summary — Delhi NCR",
        stats: [
          { label: "Total Detected", value: "1,432", trend: "+12%", trendUp: false },
          { label: "Repaired (MTD)", value: "324", trend: "+8%", trendUp: true },
          { label: "Critical Roads", value: "23", trend: "-2", trendUp: true },
          { label: "Avg Depth", value: "8.4 cm", trend: "+0.6", trendUp: false },
        ]
      },
    };
  }

  if (q.includes('overdue') || q.includes('contractor')) {
    return {
      role: 'assistant',
      content: "**2 contractor tasks are currently overdue**, requiring escalation. The Mumbai-Pune Expressway guardrail repair has exceeded its deadline by 7 days. Escalation notices were auto-dispatched to the NHAI regional office.",
      classification: 'RESTRICTED',
      tableData: [
        { "Task ID": "CT-0041", Road: "Mumbai-Pune Eway", Contractor: "Western Infra Ltd", Deadline: "2026-04-01", "Days Overdue": 7, Priority: "CRITICAL" },
        { "Task ID": "CT-0038", Road: "NH-48 Jaipur Hwy", Contractor: "Suraksha Electricals", Deadline: "2026-04-05", "Days Overdue": 3, Priority: "HIGH" },
      ],
    };
  }

  if (q.includes('budget') || q.includes('finance') || q.includes('forecast') || q.includes('monsoon')) {
    return {
      role: 'assistant',
      content: "**Pre-Monsoon Budget Forecast (Apr-Jun 2026)** based on predictive AI analysis of road degradation patterns and historical monsoon damage data across the Delhi NCR network.",
      classification: 'CONFIDENTIAL',
      dataCard: {
        title: "Pre-Monsoon Budget Allocation",
        stats: [
          { label: "Emergency Repairs", value: "₹18.5 Cr" },
          { label: "Preventive Maintenance", value: "₹12.3 Cr" },
          { label: "Infra Upgrades", value: "₹8.7 Cr" },
          { label: "Projected Savings vs Reactive", value: "67%", trend: "↑", trendUp: true },
        ]
      },
    };
  }

  if (q.includes('school') || q.includes('blackspot')) {
    return {
      role: 'assistant',
      content: "**Critical Alert:** 3 accident blackspots identified within 500m of school zones. These require immediate intervention — missing speed breakers and pedestrian crossings are the primary risk factors.",
      classification: 'RESTRICTED',
      tableData: [
        { Zone: "Pitampura School Zone", Distance: "120m", Risk: 94, Issue: "No Speed Breakers", School: "DPS Pitampura" },
        { Zone: "Sarita Vihar Crossing", Distance: "280m", Risk: 87, Issue: "No Ped Crossing", School: "Ryan International" },
        { Zone: "Dwarka Sec-8 Rd", Distance: "350m", Risk: 78, Issue: "Poor Lighting", School: "Mount Carmel School" },
      ],
    };
  }

  if (q.includes('speed') || q.includes('violation')) {
    return {
      role: 'assistant',
      content: "**Speed Violation Analysis** across the monitored road network. Outer Ring Road, DND Flyway and Rohtak Road are the top 3 violation hotspots. Peak violations occur between 10 PM - 2 AM.",
      classification: 'UNCLASSIFIED',
      dataCard: {
        title: "Speed Violation Intelligence",
        stats: [
          { label: "Daily Avg Violations", value: "412" },
          { label: "Peak Hours", value: "10PM-2AM" },
          { label: "Top Hotspot", value: "Outer Ring Rd" },
          { label: "Cameras Recommended", value: "14" },
        ]
      },
    };
  }

  // Default
  return {
    role: 'assistant',
    content: `I've analyzed your query across the RastaRaksha intelligence database. Based on the current road network data covering 2,847 km across Delhi NCR with 1,432 active pothole detections and 84 blackspot zones, here's what I can tell you:\n\nThe overall Road Health Index stands at **76/100 (Moderate)**. North Delhi and Faridabad districts are below critical threshold. Would you like me to drill down into a specific district, generate an RTI-format report, or analyze contractor performance data?`,
    classification: 'UNCLASSIFIED',
  };
}

/* ── Component ─────────────────────────────────── */
export default function GovChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      role: 'system',
      content: 'RastaRaksha AI Intelligence Assistant initialized. This is a classified government terminal with role-based access. All conversations are encrypted and logged.',
      timestamp: new Date(),
      classification: 'UNCLASSIFIED',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateMockResponse(query);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        ...response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const classificationColors: Record<string, string> = {
    'UNCLASSIFIED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'RESTRICTED': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'CONFIDENTIAL': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <BrainCircuit size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    RastaRaksha Intelligence Terminal
                    <span className="text-[9px] font-black text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20 uppercase tracking-wider">AI-Powered</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold">Query road data, generate reports, and get AI-driven insights</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  <Lock size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">E2E Encrypted</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? '' : ''}`}>
                    
                    {/* System message */}
                    {msg.role === 'system' && (
                      <div className="flex items-start gap-3 bg-slate-800/20 border border-slate-700/30 rounded-xl p-4">
                        <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">{msg.content}</p>
                          <p className="text-[9px] text-slate-600 font-mono mt-2">{msg.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )}

                    {/* User message */}
                    {msg.role === 'user' && (
                      <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-2xl rounded-br-md px-5 py-3.5">
                        <p className="text-sm text-white font-semibold leading-relaxed">{msg.content}</p>
                        <p className="text-[9px] text-indigo-300/50 font-mono mt-2 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                      </div>
                    )}

                    {/* Assistant message */}
                    {msg.role === 'assistant' && (
                      <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl rounded-bl-md overflow-hidden">
                        {/* Classification Banner */}
                        {msg.classification && (
                          <div className={`px-4 py-1.5 border-b border-slate-700/30 flex items-center justify-between ${
                            msg.classification === 'CONFIDENTIAL' ? 'bg-rose-500/5' : 
                            msg.classification === 'RESTRICTED' ? 'bg-amber-500/5' : 'bg-slate-800/30'
                          }`}>
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded border ${classificationColors[msg.classification]}`}>
                              {msg.classification}
                            </span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleCopy(msg.id, msg.content)} className="text-slate-500 hover:text-white transition-colors p-1 rounded">
                                {copiedId === msg.id ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                              <button className="text-slate-500 hover:text-white transition-colors p-1 rounded">
                                <Download size={12} />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles size={13} className="text-white" />
                            </div>
                            <p className="text-sm text-slate-200 font-medium leading-relaxed" dangerouslySetInnerHTML={{ 
                              __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                            }} />
                          </div>

                          {/* Data Card */}
                          {msg.dataCard && (
                            <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">{msg.dataCard.title}</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {msg.dataCard.stats.map((s, i) => (
                                  <div key={i} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20">
                                    <div className="text-lg font-black text-white leading-tight">{s.value}</div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
                                    {s.trend && (
                                      <div className={`text-[10px] font-bold mt-1 ${s.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>{s.trend}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Table Data */}
                          {msg.tableData && msg.tableData.length > 0 && (
                            <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="text-[9px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-700/30">
                                      {Object.keys(msg.tableData[0]).map(key => (
                                        <th key={key} className="px-4 py-2.5">{key}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {msg.tableData.map((row, ri) => (
                                      <tr key={ri} className="border-b border-slate-800/30 last:border-0">
                                        {Object.values(row).map((val, ci) => (
                                          <td key={ci} className="px-4 py-2.5 text-[11px] text-slate-300 font-semibold">{String(val)}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <p className="text-[9px] text-slate-600 font-mono mt-3">{msg.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl rounded-bl-md px-5 py-4 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles size={13} className="text-white animate-pulse" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">Analyzing road intelligence data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Query road intelligence data... (e.g. 'Top 10 worst roads by RHI')"
                    className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[9px] text-slate-600 font-bold">
                    <Lock size={10} />AES-256
                  </div>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar — Quick Queries */}
          <div className="w-[280px] shrink-0 bg-slate-900/40 border-l border-slate-800/60 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800/60">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Quick Intelligence Queries</h3>
              <p className="text-[9px] text-slate-600 font-medium">Click to instantly query the AI</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
              {QUICK_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.label)}
                  disabled={isTyping}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-600/40 transition-all group disabled:opacity-40"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0 group-hover:border-violet-500/30 group-hover:bg-violet-500/10 transition-colors text-slate-400 group-hover:text-violet-400">
                    {q.icon}
                  </div>
                  <div>
                    <span className="text-[12px] font-bold text-slate-300 group-hover:text-white transition-colors block leading-tight">{q.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider mt-1 inline-block ${
                      q.category === 'Critical' ? 'text-rose-400' :
                      q.category === 'Finance' ? 'text-amber-400' :
                      q.category === 'Audit' ? 'text-cyan-400' :
                      q.category === 'Operations' ? 'text-emerald-400' :
                      'text-slate-500'
                    }`}>{q.category}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Session Info */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-900/60">
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Session Info</span>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Clearance</span>
                    <span className="text-amber-400 font-black">Level 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Data Scope</span>
                    <span className="text-white font-bold">Delhi NCR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Encryption</span>
                    <span className="text-emerald-400 font-bold">AES-256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Queries</span>
                    <span className="text-white font-bold">{messages.filter(m => m.role === 'user').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
