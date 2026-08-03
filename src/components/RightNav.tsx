import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Camera, Clock, Home, Settings, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const tabs = [
  { path: '/home', icon: Home, key: 'home' },
  { path: '/scan', icon: Camera, key: 'scan', primary: true },
  { path: '/analytics', icon: BarChart3, key: 'analytics' },
  { path: '/education', icon: BookOpen, key: 'education' },
  { path: '/history', icon: Clock, key: 'history' },
  { path: '/settings', icon: Settings, key: 'settings' },
  { path: '/profile', icon: User, key: 'profile' },
];

export function RightNav() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
      <nav className="glass-card flex w-16 flex-col items-center gap-2 rounded-2xl p-2">
        {tabs.map(({ path, icon: Icon, key, primary }) => {
          const active = location.pathname === path;

          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              title={t(key)}
              aria-label={t(key)}
              className={`tap-scale flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                primary
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-300/40 dark:shadow-green-900/40'
                  : active
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={21} strokeWidth={active || primary ? 2.5 : 2} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
