import { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, CloudSun, Globe, ChevronDown, Clock, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export default function Navbar() {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const langRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="h-[72px] bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 sticky top-0 z-40 flex items-center justify-between px-8">
      {/* Left — Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-9 h-9 rounded-lg object-cover shadow-lg" />
          <div>
            <h2 className="text-white text-[15px] font-black tracking-wide leading-tight">
              RastaRaksha <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-emerald-400">NCC</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] leading-tight">National Command Center</p>
          </div>
        </div>
      </div>

      {/* Center — Weather + Time Strip */}
      <div className="flex items-center gap-3">
        {/* Weather Widget */}
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 shadow-inner">
          <CloudSun className="w-5 h-5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-white text-sm font-bold leading-tight">32°C</span>
            <span className="text-slate-400 text-[10px] font-semibold">Partly Cloudy</span>
          </div>
          <div className="h-7 w-px bg-slate-700 mx-1"></div>
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 text-xs font-bold">New Delhi</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 shadow-inner">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div className="flex flex-col">
            <span className="text-white text-sm font-bold font-mono leading-tight tracking-wider">{formatTime(currentTime)}</span>
            <span className="text-slate-400 text-[10px] font-semibold leading-tight">{formatDate(currentTime)}</span>
          </div>
        </div>

        {/* Language Popup */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-300 shadow-inner ${
              langOpen 
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{selectedLang.code}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Language Dropdown */}
          {langOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Interface Language</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Select preferred government interface language</p>
              </div>
              <div className="p-2 max-h-[280px] overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      selectedLang.code === lang.code
                        ? 'bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-cyan-500/30'
                        : 'hover:bg-slate-700/40 border border-transparent'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className={`text-sm font-bold ${selectedLang.code === lang.code ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
                        {lang.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{lang.native}</span>
                    </div>
                    {selectedLang.code === lang.code && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 text-slate-400 hover:text-white transition-all bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-slate-600 group">
          <Bell className="w-[18px] h-[18px] group-hover:animate-[wiggle_0.3s_ease-in-out]" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 border-2 border-slate-900"></span>
        </button>

        <button className="p-2.5 text-slate-400 hover:text-white transition-all bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-slate-600">
          <Settings className="w-[18px] h-[18px]" />
        </button>

        <div className="h-8 w-px bg-slate-700/50 mx-0.5"></div>

        <button onClick={logout} className="p-2.5 text-slate-400 hover:text-rose-400 transition-all bg-slate-800/50 hover:bg-rose-500/10 rounded-xl border border-slate-700/50 hover:border-rose-500/30" title="Logout">
          <LogOut className="w-[18px] h-[18px]" />
        </button>

        <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-gradient-to-r from-slate-800 to-slate-800/40 rounded-xl hover:from-slate-700 hover:to-slate-700/40 border border-slate-700/60 transition-all shadow-inner group">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-shadow ${
            user?.role === 'gov' 
              ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20 group-hover:shadow-orange-500/40'
              : 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/20 group-hover:shadow-pink-500/40'
          }`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white text-sm font-bold leading-tight">{user?.name || 'User'}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${
              user?.role === 'gov' ? 'text-amber-400/80' : 'text-pink-400/80'
            }`}>{user?.department || user?.role?.toUpperCase()}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
