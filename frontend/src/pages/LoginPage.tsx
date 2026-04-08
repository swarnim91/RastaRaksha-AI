import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, Mail, Lock, Eye, EyeOff, ArrowRight, 
  Landmark, Fingerprint, AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'gov' | 'ngo' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate auth delay
    await new Promise(r => setTimeout(r, 800));

    const result = login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  const govHints = ['officer@morth.gov.in', 'admin@nic.in', 'analyst@pwd.gov.in'];
  const ngoHints = ['contact@roadsafetyfoundation.ngo', 'info@cleanroads.trust', 'team@sadak-samiti.ngo'];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-green-500 opacity-80"></div>
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/3 to-pink-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/rastaraksha-logo.png" alt="RastaRaksha AI" className="w-14 h-14 rounded-2xl object-cover shadow-2xl shadow-red-500/30" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">RastaRaksha AI</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.25em]">National Road Intelligence System</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500"></div>
            <span className="text-[9px] text-slate-600 font-black uppercase tracking-wider">Government of India Initiative</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-green-500"></div>
          </div>
        </div>

        {/* Role Selection */}
        {!selectedRole ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-400 font-semibold mb-6">Select your role to continue</p>
            
            {/* Government Card */}
            <button
              onClick={() => setSelectedRole('gov')}
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 text-left hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-violet-600 transition-all">
                  <Landmark size={24} className="text-indigo-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Government Portal
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">IAS Officers, PWD, MoRTH, NHAI Officials</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[8px] font-black text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-wider">@gov.in</span>
                    <span className="text-[8px] font-black text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-wider">@nic.in</span>
                    <span className="text-[8px] font-black text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-wider">@morth.gov.in</span>
                  </div>
                </div>
              </div>
            </button>

            {/* NGO Card */}
            <button
              onClick={() => setSelectedRole('ngo')}
              className="w-full bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6 text-left hover:border-pink-500/40 hover:bg-slate-800/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/20 flex items-center justify-center group-hover:from-pink-600 group-hover:to-rose-600 transition-all">
                  <Heart size={24} className="text-pink-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    NGO Portal
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Road Safety NGOs, Trusts & Community Organizations</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[8px] font-black text-pink-300/60 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/10 uppercase tracking-wider">@foundation</span>
                    <span className="text-[8px] font-black text-pink-300/60 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/10 uppercase tracking-wider">@trust</span>
                    <span className="text-[8px] font-black text-pink-300/60 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/10 uppercase tracking-wider">@ngo</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-xl">
            {/* Form Header */}
            <div className={`px-6 py-4 border-b border-slate-700/30 flex items-center justify-between ${
              selectedRole === 'gov' ? 'bg-indigo-500/5' : 'bg-pink-500/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRole === 'gov' 
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600' 
                    : 'bg-gradient-to-br from-pink-600 to-rose-600'
                }`}>
                  {selectedRole === 'gov' ? <Landmark size={18} className="text-white" /> : <Heart size={18} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedRole === 'gov' ? 'Government Login' : 'NGO Login'}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{selectedRole === 'gov' ? 'Authorized personnel only · AES-256 encrypted' : 'Registered NGOs & community organizations'}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRole(null); setEmail(''); setPassword(''); setError(''); }}
                className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
                ← Back
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span className="text-xs text-rose-300 font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">
                  {selectedRole === 'gov' ? 'Government Email' : 'Organization Email'}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={selectedRole === 'gov' ? 'officer@morth.gov.in' : 'contact@roadsafety.ngo'}
                    className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                    autoFocus
                  />
                </div>
                {/* Email Hints */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(selectedRole === 'gov' ? govHints : ngoHints).map((hint, i) => (
                    <button key={i} type="button" onClick={() => setEmail(hint)}
                      className="text-[9px] text-slate-500 bg-slate-800/40 border border-slate-700/30 px-2 py-1 rounded-md hover:text-white hover:border-slate-600 transition-all font-mono">
                      {hint}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className={`w-full font-black text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 ${
                  selectedRole === 'gov'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-500/20'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    {selectedRole === 'gov' ? 'Authenticate & Access Portal' : 'Login to NGO Portal'}
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="flex items-center gap-2 justify-center mt-4">
                <Lock size={10} className="text-slate-600" />
                <span className="text-[9px] text-slate-600 font-semibold">
                  {selectedRole === 'gov' 
                    ? 'Secured under IT Act 2000 · All sessions logged & audited' 
                    : 'AES-256 encrypted · DARPG compliant authentication'
                  }
                </span>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[9px] text-slate-700 font-semibold">
            © 2026 RastaRaksha AI · Ministry of Road Transport & Highways · Government of India
          </p>
        </div>
      </div>
    </div>
  );
}
