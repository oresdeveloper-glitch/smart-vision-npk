import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleLogin = async () => {
    if (locked) return;
    if (!email || !password) { setError('Please enter email and password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');
    try {
      const err = await login(email, password);
      if (!err) {
        setAttempts(0);
        navigate('/home');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLocked(true);
          setError('Account temporarily locked. Please try again later.');
          setTimeout(() => { setLocked(false); setAttempts(0); }, 30000);
        } else {
          setError(err);
        }
      }
    } catch (e) {
      setError('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const pwStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const pwColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/40 via-green-900/30 to-slate-950/40" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center shadow-2xl mb-5">
            <Leaf size={36} className="text-white" fill="white" fillOpacity={0.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('appName')}</h1>
          <p className="text-white/50 text-sm mt-1.5">{t('welcomeMessage')}</p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 justify-center mb-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/20 backdrop-blur-sm">
          <ShieldCheck size={14} className="text-green-300" />
          <span className="text-[10px] font-semibold text-green-300 uppercase tracking-widest">Secure Connection · TLS 1.3</span>
        </div>

        {/* Form */}
        <div className="space-y-3.5">
          {error && (
            <div className={`p-3.5 rounded-xl border backdrop-blur-sm text-sm text-center ${
              locked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}>
              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck size={14} />
                {error}
              </div>
            </div>
          )}

          {/* Attempts indicator */}
          {attempts > 0 && !locked && (
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < attempts ? 'bg-amber-400' : 'bg-white/10'}`} />
              ))}
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input
              type="email" placeholder={t('email')} value={email} disabled={locked}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all disabled:opacity-40"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
            <input
              type={showPw ? 'text' : 'password'} placeholder={t('password')} value={password} disabled={locked}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all disabled:opacity-40"
            />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pwColors[pwStrength]}`} style={{ width: `${pwStrength * 25}%` }} />
              </div>
              <span className="text-[10px] text-white/50 font-medium">{pwLabels[pwStrength]}</span>
            </div>
          )}

          <button onClick={() => navigate('/forgot-password')} className="text-sm text-green-300 hover:text-green-200 font-medium text-right w-full transition-colors">
            {t('forgotPassword')}
          </button>

          <button
            onClick={handleLogin} disabled={loading || locked}
            className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-600/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <ArrowRight size={20} />
            )}
            {t('signIn')}
          </button>



          <p className="text-center text-sm text-white/40">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-green-300 hover:text-green-200 font-semibold">
              {t('signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
