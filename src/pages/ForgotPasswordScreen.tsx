import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, ArrowLeft, CheckCircle, Leaf } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{t('forgotPassword')}</h1>
          <p className="text-white/50 text-sm mt-1">Enter your email to receive reset instructions</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Check your email</p>
            <p className="text-white/50 text-sm">Password reset instructions have been sent to {email}</p>
            <button onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all active:scale-[0.98]">
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300/50" />
              <input type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 focus:border-green-400/50 focus:ring-2 focus:ring-green-500/20 outline-none text-white placeholder-white/30 text-sm backdrop-blur-sm transition-all" />
            </div>
            <button type="submit" disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : null}
              Send Reset Link
            </button>
            <button type="button" onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-white/70 text-sm py-2 transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
