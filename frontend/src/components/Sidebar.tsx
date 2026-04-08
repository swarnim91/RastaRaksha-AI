import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Settings, ShieldAlert, BookOpen, Wrench, BrainCircuit, BarChart3, MessageSquareText, Heart } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const mainNav = [
    { path: '/dashboard', icon: Home, label: 'Command Center', labelHi: 'कमांड सेंटर' },
    { path: '/geo', icon: Map, label: 'Geo Analytics', labelHi: 'भू-विश्लेषण' },
    { path: '/reports', icon: BarChart3, label: 'Intelligence Reports', labelHi: 'खुफिया रिपोर्ट' },
    { path: '/emergency-dispatch', icon: ShieldAlert, label: 'Emergency Control', labelHi: 'आपातकालीन नियंत्रण' },
  ];

  const advancedNav = [
    { path: '/contractors', icon: Wrench, label: 'Contractor Portal', labelHi: 'ठेकेदार पोर्टल' },
    { path: '/predictive', icon: BrainCircuit, label: 'Predictive AI', labelHi: 'भविष्यवाणी AI' },
    { path: '/chat', icon: MessageSquareText, label: 'Gov Intelligence Chat', labelHi: 'सरकारी AI चैट' },
    { path: '/ngo', icon: Heart, label: 'NGO Collaboration', labelHi: 'NGO सहयोग' },
    { path: '/settings', icon: Settings, label: 'System Config', labelHi: 'सिस्टम कॉन्फ़िग' },
  ];

  const NavLink = ({ item }: { item: typeof mainNav[0] }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 group ${
          isActive(item.path)
            ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-amber-300 border border-amber-500/20 shadow-lg shadow-amber-900/10'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
        }`}
      >
        <Icon className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive(item.path) ? 'scale-110 text-amber-400' : 'group-hover:scale-110'}`} />
        <div className="flex flex-col">
          <span className="text-[13px] font-bold tracking-wide">{item.label}</span>
          <span className="text-[10px] opacity-60 font-medium">{item.labelHi}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-[260px] bg-slate-950/95 backdrop-blur-xl h-screen sticky left-0 top-0 border-r border-slate-800 flex flex-col z-50 shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 mb-4">
          <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-11 h-11 rounded-xl object-cover shadow-xl shadow-orange-500/10" />
          <div>
            <h1 className="text-white font-black text-[15px] tracking-wide leading-tight">RastaRaksha</h1>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-500 text-[10px] font-black uppercase tracking-[0.15em] leading-tight">
              Bharat Road Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm bg-emerald-500/10 py-2 px-3 rounded-lg border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300 font-bold text-[11px] tracking-wider uppercase">System Online</span>
          <span className="ml-auto text-emerald-500/50 text-[10px] font-mono">v2.1</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 ml-3 flex items-center gap-2">
          <div className="w-3 h-px bg-slate-700"></div>
          Core Operations
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>
        {mainNav.map((item) => <NavLink key={item.path} item={item} />)}

        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 mt-5 ml-3 flex items-center gap-2">
          <div className="w-3 h-px bg-slate-700"></div>
          Advanced Modules
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>
        {advancedNav.map((item) => <NavLink key={item.path} item={item} />)}
      </nav>

      {/* Footer Region */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 rounded-xl p-4 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">Active Region</span>
          </div>
          <div className="text-[15px] font-black text-white leading-tight">Delhi NCR</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-500 font-bold">Zone 4 · North India</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center border border-slate-800">
              <div className="text-xs font-black text-white">14</div>
              <div className="text-[9px] text-slate-500 font-bold">Districts</div>
            </div>
            <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center border border-slate-800">
              <div className="text-xs font-black text-white">2,847</div>
              <div className="text-[9px] text-slate-500 font-bold">Km Roads</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
