import { useLanguage } from '../contexts/LanguageContext';

import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, Clock, User } from 'lucide-react';

const tabs = [
  { path: '/home', icon: Home, key: 'home' },
  { path: '/scan', icon: Camera, key: 'scan' },
  { path: '/history', icon: Clock, key: 'history' },
  { path: '/profile', icon: User, key: 'profile' },
];

export function BottomNav() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom pointer-events-none">
      <div className="max-w-lg mx-auto px-4 pb-1">
        <nav className="glass-card rounded-2xl flex items-center justify-around h-[66px] px-1 pointer-events-auto">
          {tabs.map(({ path, icon: Icon, key }) => {
            const active = location.pathname === path;
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className="tap-scale flex flex-col items-center gap-0.5 min-w-[56px] group"
              >
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  active
                    ? 'text-green-600 dark:text-green-400 font-semibold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {t(key)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

