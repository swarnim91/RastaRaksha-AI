import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Heart, MapPin, Camera, Send, CheckCircle2, Clock,
  Trophy, Users, Shield, FileText,
  CalendarDays, Megaphone, Eye, Sparkles,
  ThumbsUp, Award, Target, Wrench, CircleDot
} from 'lucide-react';

/* ── Types ─────────────────────────────────────── */
interface Complaint {
  id: string;
  ngoName: string;
  road: string;
  district: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  status: 'Filed' | 'Verified' | 'Assigned' | 'In Progress' | 'Repaired';
  filedDate: string;
  resolvedDate?: string;
  photoCount: number;
  upvotes: number;
  govResponse?: string;
}

interface RepairDrive {
  id: string;
  ngoName: string;
  title: string;
  date: string;
  location: string;
  volunteers: number;
  potholesFixed: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  verified: boolean;
}

/* ── Mock Data ─────────────────────────────────── */
const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'NGO-2026-0412', ngoName: 'Road Safety Foundation', road: 'MG Road, Sector 14', district: 'Gurugram', severity: 'CRITICAL', description: 'Massive pothole cluster near metro exit — 3 accidents reported this week. Immediate patching required.', status: 'In Progress', filedDate: '2026-04-05', photoCount: 4, upvotes: 127, govResponse: 'Assigned to contractor: Western Infra Ltd. ETA: 48 hours.' },
  { id: 'NGO-2026-0408', ngoName: 'Sadak Suraksha Samiti', road: 'NH-58 Near Ghazipur', district: 'East Delhi', severity: 'HIGH', description: 'Deep trench-like pothole (est. 15cm) on main lane. Trucks swerving to avoid — extremely dangerous at night.', status: 'Verified', filedDate: '2026-04-03', photoCount: 6, upvotes: 89 },
  { id: 'NGO-2026-0401', ngoName: 'CleanRoads India', road: 'Outer Ring Road, Nehru Place', district: 'South Delhi', severity: 'CRITICAL', description: 'Multiple potholes over 200m stretch. Waterlogging makes them invisible during rain.', status: 'Assigned', filedDate: '2026-04-01', photoCount: 8, upvotes: 214, govResponse: 'Priority escalated. PWD team dispatched.' },
  { id: 'NGO-2026-0395', ngoName: 'Jan Chetna Trust', road: 'Vikas Marg', district: 'Central Delhi', severity: 'MEDIUM', description: 'Surface erosion near ITO flyover ramp. Could develop into potholes within 2 weeks.', status: 'Filed', filedDate: '2026-03-28', photoCount: 2, upvotes: 42 },
  { id: 'NGO-2026-0388', ngoName: 'Road Safety Foundation', road: 'GT Karnal Road', district: 'North Delhi', severity: 'HIGH', description: 'Pothole near school zone. Children walk on this road daily — no alternative path available.', status: 'Repaired', filedDate: '2026-03-25', resolvedDate: '2026-04-02', photoCount: 5, upvotes: 312, govResponse: 'Repair verified by PWD inspector on 02-Apr-2026.' },
  { id: 'NGO-2026-0372', ngoName: 'Nagrik Foundation', road: 'Mehrauli-Badarpur Rd', district: 'Faridabad', severity: 'CRITICAL', description: 'Sinkhole formation. Road surface caving in — area needs barricading and emergency repair.', status: 'Repaired', filedDate: '2026-03-20', resolvedDate: '2026-03-30', photoCount: 10, upvotes: 456, govResponse: 'Emergency repair completed. Bridge & road department notified for structural assessment.' },
];

const REPAIR_DRIVES: RepairDrive[] = [
  { id: 'RD-01', ngoName: 'CleanRoads India', title: 'Monsoon-Proof Delhi — Phase 1', date: '2026-04-15', location: 'South Delhi, 5 locations', volunteers: 85, potholesFixed: 0, status: 'Upcoming', verified: false },
  { id: 'RD-02', ngoName: 'Road Safety Foundation', title: 'School Zone Safety Drive', date: '2026-04-08', location: 'North Delhi Schools', volunteers: 42, potholesFixed: 18, status: 'Ongoing', verified: false },
  { id: 'RD-03', ngoName: 'Sadak Suraksha Samiti', title: 'NH-58 Community Repair', date: '2026-03-28', location: 'NH-58 Ghazipur stretch', volunteers: 120, potholesFixed: 47, status: 'Completed', verified: true },
  { id: 'RD-04', ngoName: 'Jan Chetna Trust', title: 'ITO Flyover Restoration', date: '2026-03-15', location: 'ITO Junction, Central Delhi', volunteers: 65, potholesFixed: 32, status: 'Completed', verified: true },
];

const NGO_LEADERBOARD = [
  { rank: 1, name: 'Road Safety Foundation', complaints: 89, resolved: 72, drives: 12, impact: 'A+', score: 945 },
  { rank: 2, name: 'CleanRoads India', complaints: 76, resolved: 61, drives: 8, impact: 'A', score: 830 },
  { rank: 3, name: 'Sadak Suraksha Samiti', complaints: 64, resolved: 58, drives: 15, impact: 'A', score: 812 },
  { rank: 4, name: 'Jan Chetna Trust', complaints: 52, resolved: 41, drives: 6, impact: 'B+', score: 680 },
  { rank: 5, name: 'Nagrik Foundation', complaints: 48, resolved: 44, drives: 9, impact: 'A-', score: 720 },
];

type TabKey = 'complaints' | 'drives' | 'leaderboard' | 'file';

export default function NgoPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>('complaints');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  // Complaint form state
  const [formNgo, setFormNgo] = useState('');
  const [formRoad, setFormRoad] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formSeverity, setFormSeverity] = useState('HIGH');
  const [formDescription, setFormDescription] = useState('');

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setFormNgo(''); setFormRoad(''); setFormDistrict(''); setFormDescription('');
    setTimeout(() => { setShowSuccess(false); setActiveTab('complaints'); }, 3000);
  };

  const filteredComplaints = statusFilter === 'all' 
    ? MOCK_COMPLAINTS
    : MOCK_COMPLAINTS.filter(c => c.status === statusFilter);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'complaints', label: 'Complaint Tracker', icon: <Eye size={14} /> },
    { key: 'file', label: 'File Complaint', icon: <Megaphone size={14} /> },
    { key: 'drives', label: 'Repair Drives', icon: <Wrench size={14} /> },
    { key: 'leaderboard', label: 'NGO Leaderboard', icon: <Trophy size={14} /> },
  ];

  const statuses = ['all', 'Filed', 'Verified', 'Assigned', 'In Progress', 'Repaired'];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Filed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Verified': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Repaired': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500/10 text-rose-400';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  };

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
                <Heart className="text-pink-400" size={24} />
                NGO Collaboration Portal
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">Crowdsourced road repair, verified impact tracking & citizen-government bridge</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/10 border border-pink-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Users size={14} className="text-pink-400" />
                <span className="text-pink-300 font-black text-sm">12 Registered NGOs</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-emerald-300 font-black text-sm">276 Potholes Fixed</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total Complaints", value: "489", icon: <FileText size={16} className="text-indigo-400" />, sub: "This quarter" },
              { label: "Avg Resolution", value: "6.2 days", icon: <Clock size={16} className="text-cyan-400" />, sub: "↓ 18% from last month" },
              { label: "Active Drives", value: "3", icon: <Target size={16} className="text-amber-400" />, sub: "240+ volunteers" },
              { label: "Gov Response Rate", value: "94%", icon: <Shield size={16} className="text-emerald-400" />, sub: "Within 48 hours" },
              { label: "Community Impact", value: "A+", icon: <Award size={16} className="text-pink-400" />, sub: "PMGSY Compliant" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/30">{s.icon}</div>
                <div>
                  <div className="text-lg font-black text-white leading-tight">{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{s.sub}</div>
                </div>
              </div>
            ))}
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

          {/* ═══ TAB: COMPLAINT TRACKER ═══ */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              {/* Status Filters */}
              <div className="flex gap-2 mb-2">
                {statuses.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      statusFilter === s ? 'bg-slate-700/40 text-white border-slate-600' : 'text-slate-500 border-slate-800 hover:text-white'
                    }`}
                  >{s === 'all' ? 'All' : s} {s !== 'all' && <span className="ml-1 opacity-50">({MOCK_COMPLAINTS.filter(c => c.status === s).length})</span>}</button>
                ))}
              </div>

              {/* Complaint Cards */}
              {filteredComplaints.map(c => (
                <div key={c.id} className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden hover:border-slate-600/50 transition-all">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-violet-500/10 border border-pink-500/20 flex items-center justify-center">
                          <Heart size={16} className="text-pink-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">{c.ngoName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">{c.id}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{c.filedDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${getSeverityStyle(c.severity)}`}>{c.severity}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${getStatusStyle(c.status)}`}>{c.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-semibold">
                      <MapPin size={13} className="text-slate-500" />
                      <span>{c.road}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-500">{c.district}</span>
                    </div>

                    <p className="text-sm text-slate-300 font-medium leading-relaxed mb-3">{c.description}</p>

                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Camera size={12} /> {c.photoCount} photos</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-indigo-400" /> {c.upvotes} upvotes</span>
                      {c.resolvedDate && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Resolved {c.resolvedDate}</span>}
                    </div>

                    {/* Gov Response */}
                    {c.govResponse && (
                      <div className="mt-3 bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 flex items-start gap-2.5">
                        <Shield size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Government Response</span>
                          <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">{c.govResponse}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {c.status !== 'Repaired' && (
                    <div className="px-5 pb-4">
                      <div className="flex justify-between text-[8px] text-slate-600 font-black uppercase tracking-wider mb-1">
                        <span>Filed</span><span>Verified</span><span>Assigned</span><span>In Progress</span><span>Repaired</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${['Filed','Verified','Assigned','In Progress','Repaired'].indexOf(c.status) / 4 * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ═══ TAB: FILE COMPLAINT ═══ */}
          {activeTab === 'file' && (
            <div className="max-w-2xl mx-auto">
              {showSuccess ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Complaint Filed Successfully!</h3>
                  <p className="text-sm text-slate-400 font-medium mb-4">Reference: NGO-2026-{Math.floor(1000 + Math.random() * 9000)}</p>
                  <p className="text-xs text-emerald-300 font-semibold">Auto-routed to PWD · Expected response within 48 hours</p>
                </div>
              ) : (
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/50">
                    <h2 className="text-sm font-black text-white flex items-center gap-2">
                      <Megaphone size={16} className="text-pink-400" /> File a New Pothole Complaint
                    </h2>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">All complaints are AI-verified and auto-routed to the relevant PWD division</p>
                  </div>
                  
                  <form onSubmit={handleSubmitComplaint} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">NGO / Organization Name</label>
                        <input type="text" required value={formNgo} onChange={e => setFormNgo(e.target.value)} placeholder="e.g. Road Safety Foundation"
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-pink-500/40 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">District / Zone</label>
                        <select required value={formDistrict} onChange={e => setFormDistrict(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500/40 transition-all appearance-none"
                        >
                          <option value="">Select District</option>
                          <option>Central Delhi</option><option>North Delhi</option><option>South Delhi</option>
                          <option>East Delhi</option><option>Gurugram</option><option>Noida</option>
                          <option>Faridabad</option><option>Ghaziabad</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Road / Location</label>
                      <div className="relative">
                        <input type="text" required value={formRoad} onChange={e => setFormRoad(e.target.value)} placeholder="e.g. MG Road near Sector 14 Metro Exit"
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-pink-500/40 transition-all"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg text-[9px] font-black text-pink-300 uppercase tracking-wider hover:bg-pink-500/20 transition-all">
                          <MapPin size={10} className="inline mr-1" />GPS
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Severity Level</label>
                        <select value={formSeverity} onChange={e => setFormSeverity(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500/40 transition-all appearance-none"
                        >
                          <option value="LOW">Low — Surface crack</option>
                          <option value="MEDIUM">Medium — Visible pothole</option>
                          <option value="HIGH">High — Deep / Dangerous</option>
                          <option value="CRITICAL">Critical — Sinkhole / Accident Risk</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Upload Evidence</label>
                        <div className="w-full bg-slate-900/50 border border-dashed border-slate-700/40 rounded-xl px-4 py-3 text-center cursor-pointer hover:border-pink-500/30 transition-all">
                          <Camera size={18} className="text-slate-500 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-500 font-bold">Click to upload photos</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Detailed Description</label>
                      <textarea required value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={4}
                        placeholder="Describe the pothole size, depth, road condition, and any accidents observed..."
                        className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-pink-500/40 transition-all resize-none"
                      />
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                      <Send size={16} /> Submit Complaint to Government
                    </button>
                    <p className="text-[9px] text-slate-600 text-center font-semibold">
                      All submissions are encrypted (AES-256) · Auto-routed to PWD & MoRTH · Expected response: 48 hours
                    </p>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: REPAIR DRIVES ═══ */}
          {activeTab === 'drives' && (
            <div className="space-y-4">
              {REPAIR_DRIVES.map(drive => (
                <div key={drive.id} className={`bg-slate-800/30 border rounded-2xl p-5 transition-all ${
                  drive.status === 'Ongoing' ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' :
                  drive.status === 'Upcoming' ? 'border-indigo-500/30' :
                  'border-slate-700/40'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-white">{drive.title}</h3>
                        {drive.verified && (
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider flex items-center gap-0.5">
                            <CheckCircle2 size={8} /> Gov Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">by {drive.ngoName}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                      drive.status === 'Upcoming' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      drive.status === 'Ongoing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{drive.status}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/20 text-center">
                      <CalendarDays size={14} className="text-slate-500 mx-auto mb-1" />
                      <div className="text-xs font-black text-white">{drive.date}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Date</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/20 text-center">
                      <MapPin size={14} className="text-slate-500 mx-auto mb-1" />
                      <div className="text-xs font-black text-white">{drive.location}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Location</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/20 text-center">
                      <Users size={14} className="text-slate-500 mx-auto mb-1" />
                      <div className="text-xs font-black text-white">{drive.volunteers}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Volunteers</div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/20 text-center">
                      <CircleDot size={14} className="text-slate-500 mx-auto mb-1" />
                      <div className="text-xs font-black text-emerald-400">{drive.potholesFixed}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Potholes Fixed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ TAB: LEADERBOARD ═══ */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Trophy size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">NGO Impact Leaderboard</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">Gamified scoring based on complaints filed, resolution rate, and community drives organized</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 uppercase tracking-wider">
                  <Sparkles size={10} className="inline mr-1" />Updated Daily
                </span>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-700/40">
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">NGO</th>
                      <th className="px-6 py-3">Complaints</th>
                      <th className="px-6 py-3">Resolved</th>
                      <th className="px-6 py-3">Drives</th>
                      <th className="px-6 py-3">Impact Grade</th>
                      <th className="px-6 py-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NGO_LEADERBOARD.map((ngo) => (
                      <tr key={ngo.rank} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-lg font-black ${ngo.rank === 1 ? 'text-amber-400' : ngo.rank === 2 ? 'text-slate-300' : ngo.rank === 3 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {ngo.rank === 1 ? '🥇' : ngo.rank === 2 ? '🥈' : ngo.rank === 3 ? '🥉' : `#${ngo.rank}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                              <Heart size={12} className="text-pink-400" />
                            </div>
                            <span className="text-sm font-bold text-white">{ngo.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{ngo.complaints}</td>
                        <td className="px-6 py-4 text-xs font-bold text-emerald-400">{ngo.resolved}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{ngo.drives}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-black px-2 py-1 rounded-md ${
                            ngo.impact.startsWith('A') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{ngo.impact}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">{ngo.score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
