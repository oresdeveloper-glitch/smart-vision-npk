import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';

const pwRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[!@#$%^&*]/.test(p), label: 'One special character' },
];

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const pwScore = pwRules.filter(r => r.test(password)).length;
  const pwMatch = confirmPw.length > 0 ? password === confirmPw : null;
  const canSubmit = name && username && email && password.length >= 6 && agreed;

  const handleRegister = async () => {
    if (!canSubmit) { setError('Please fill all required fields and agree to terms.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (pwScore < 3) { setError('Please use a stronger password.'); return; }
    setLoading(true); setError('');
    try {
      const err = await register(name, username, email, password, 'farmer');
      if (!err) {
        navigate('/home');
      } else {
        setError(err);
      }
    } catch {
      setError('Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/40 via-green-900/30 to-slate-950/40" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center shadow-2xl mb-4">
            <Leaf size={28} className="text-white" fill="white" fillOpacity={0.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('signUp')}</h1>
          <p className="text-white/50 text-sm mt-1">{t('appName')}</p>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 justify-center mb-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/20 backdrop-blur-sm">
          <ShieldCheck size={14} className="text-green-300" />
          <span className="text-[10px] font-semibold text-green-300 uppercase tracking-widest">End-to-End Encrypted</span>
        </div>

        <div className="space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">{error}</div>
          )}

          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input type="text" placeholder={t('name')} value={name} onChange={e => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all" />
          </div>

          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all" />
          </div>

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all" />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input type={showPw ? 'text' : 'password'} placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all" />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password rules checklist */}
          {password.length > 0 && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pwScore <= 1 ? 'bg-rose-400' : pwScore <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(pwScore / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50 font-medium">{pwScore}/5</span>
              </div>
              {pwRules.map((rule, i) => {
                const passed = rule.test(password);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                      passed ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/5 text-white/20'
                    }`}>
                      {passed ? <Check size={10} /> : '·'}
                    </div>
                    <span className={`text-[10px] ${passed ? 'text-emerald-300' : 'text-white/30'}`}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all ${
                confirmPw.length > 0
                  ? pwMatch ? 'border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/20' : 'border-rose-400/50 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20'
              }`} />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-green-500"
            />
            <span className="text-[11px] text-white/50 leading-relaxed">
              I agree to the <span className="text-green-300">Terms of Service</span> and <span className="text-green-300">Privacy Policy</span>. I understand my data is encrypted and protected.
            </span>
          </label>

          <button onClick={handleRegister} disabled={loading || !canSubmit}
            className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] disabled:opacity-40">
            {loading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : <ArrowRight size={20} />}
            {t('signUp')}
          </button>

          <p className="text-center text-sm text-white/40 pt-2">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-green-300 hover:text-green-200 font-semibold">{t('signIn')}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
