import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { IMAGES } from '../data/images';
import { Sparkles } from 'lucide-react';

const images = [IMAGES.maizeSunlit, IMAGES.beanVines, IMAGES.maizeCloseup, IMAGES.beanLeaves, IMAGES.maizeField, IMAGES.maizeLeaves];

export default function SplashScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);
  const [bgIdx] = useState(() => Math.floor(Math.random() * images.length));

  useEffect(() => {
    let hasNavigated = false;
    setTimeout(() => setShow(true), 100);
    const startAt = Date.now();
    const i = window.setInterval(() => {
      const elapsed = Date.now() - startAt;
      setProgress(() => {
        if (elapsed >= 3200) return 100;
        const tt = Math.min(1, elapsed / 3200);
        return Math.round(100 * (1 - Math.pow(1 - tt, 2.4)));
      });
    }, 80);

    const route = localStorage.getItem('npk_onboarded') ? '/login' : '/onboarding';

    const timeout = window.setTimeout(() => {
      if (hasNavigated) return;
      hasNavigated = true;
      window.clearInterval(i);
      setTimeout(() => navigate(route), 200);
    }, 3600);

    const fallback = window.setTimeout(() => {
      if (hasNavigated) return;
      hasNavigated = true;
      window.clearInterval(i);
      window.location.assign(route);
    }, 10000);

    return () => { window.clearTimeout(timeout); window.clearTimeout(fallback); window.clearInterval(i); };
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-950 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 opacity-[0.08]">
        <img src={images[bgIdx]} alt="" className="w-full h-full object-cover" />
      </div>

      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="relative mb-8 group">
          <div className="w-40 h-52 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-900/40 ring-2 ring-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
            <img src={images[(bgIdx + 1) % images.length]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-3 -right-3 w-36 h-44 rounded-[2rem] overflow-hidden shadow-xl shadow-green-900/30 ring-2 ring-white/10 -rotate-6 -z-10">
            <img src={images[(bgIdx + 2) % images.length]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-3 -left-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Sparkles size={20} className="text-white" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-1">Smart Vision</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-8 bg-green-400/40" />
            <h2 className="text-3xl font-bold text-green-300 tracking-[0.2em]">NPK</h2>
            <div className="h-px w-8 bg-green-400/40" />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-wide">{t('appTagline')}</p>
        </div>

        <div className="w-48">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-white/25 text-[10px] text-center mt-2 font-medium tracking-widest uppercase">{t('loading')}</p>
        </div>
      </div>

      <div className="absolute bottom-8 flex gap-1.5">
        {images.slice(0, 4).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${i === bgIdx % 4 ? 'bg-green-400 scale-100' : 'bg-white/10 scale-75'}`} />
        ))}
      </div>
    </div>
  );
}
