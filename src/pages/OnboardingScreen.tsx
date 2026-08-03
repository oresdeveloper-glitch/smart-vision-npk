import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { IMAGES } from '../data/images';
import { ChevronRight, ChevronLeft, ScanLine, BrainCircuit, Lightbulb, Sprout } from 'lucide-react';

const steps = [
  { key: 'step1', icon: ScanLine, bg: IMAGES.maizeCloseup },
  { key: 'step2', icon: BrainCircuit, bg: IMAGES.beanLeaves },
  { key: 'step3', icon: Lightbulb, bg: IMAGES.maizeSunlit },
  { key: 'step4', icon: Sprout, bg: IMAGES.beanVines },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const done = () => {
    localStorage.setItem('npk_onboarded', 'true');
    navigate('/login');
  };

  const goNext = () => {
    if (animating || step >= steps.length - 1) return;
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
  };

  const goBack = () => {
    if (animating || step <= 0) return;
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 200);
  };

  const isLast = step === steps.length - 1;
  const s = steps[step];
  const Icon = s.icon;

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-green-950 via-emerald-950 to-slate-950 overflow-hidden">
      {steps.map((st, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-500 ease-out"
          style={{
            opacity: i === step ? 1 : 0,
            transform: i === step ? 'translateX(0)' : `translateX(${i < step ? '-30px' : '30px'})`,
            pointerEvents: i === step ? 'auto' : 'none',
          }}
        >
          <div className="absolute inset-0">
            <img src={st.bg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/40 to-green-950/90" />
          </div>
        </div>
      ))}

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex justify-end p-4 pt-12">
          <button onClick={done} className="text-xs font-semibold text-white/50 hover:text-white px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all">
            {t('skip')}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shadow-green-900/30">
              <Icon size={52} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-white text-lg font-bold">{step + 1}</span>
            </div>
          </div>

          <div className="text-center max-w-xs">
            <h2 className="text-2xl font-bold text-white mb-3 leading-tight">{t(`${s.key}Title`)}</h2>
            <p className="text-white/60 text-base leading-relaxed">{t(`${s.key}Desc`)}</p>
          </div>
        </div>

        <div className="px-6 pb-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <button key={i} onClick={() => { if (!animating) { setAnimating(true); setTimeout(() => { setStep(i); setAnimating(false); }, 200); } }}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === step ? 28 : 8,
                  height: 8,
                  background: i === step ? 'linear-gradient(135deg, #4ADE80, #10B981)' : 'rgba(255,255,255,0.2)',
                  boxShadow: i === step ? '0 0 12px rgba(74, 222, 128, 0.4)' : 'none',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={goBack} disabled={step === 0}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                step === 0 ? 'text-white/15 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <ChevronLeft size={18} /> {t('back')}
            </button>
            {isLast ? (
              <button onClick={done}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-green-600/30 transition-all active:scale-95">
                {t('getStarted')} <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={goNext}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 transition-all active:scale-95">
                {t('next')} <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
