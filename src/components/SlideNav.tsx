import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Home, ScanLine, Clock, BarChart3, BookOpen,
  Settings, User, LogOut, Leaf, X, Shield,
  Moon, Sun, FileText, HelpCircle,
} from 'lucide-react';

interface SlideNavProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    labelKey: null as string | null,
    items: [
      { path: '/home', icon: Home, key: 'home' },
      { path: '/scan', icon: ScanLine, key: 'scan' },
      { path: '/results', icon: ScanLine, key: 'results' },
      { path: '/history', icon: Clock, key: 'history' },
      { path: '/reports', icon: FileText, key: 'reports' },
      { path: '/analytics', icon: BarChart3, key: 'analytics' },
      { path: '/education', icon: BookOpen, key: 'education' },
    ],
  },
  {
    labelKey: 'settings' as const,
    items: [
      { path: '/help', icon: HelpCircle, key: 'helpSupport' },
      { path: '/settings', icon: Settings, key: 'settings' },
      { path: '/profile', icon: User, key: 'profile' },
    ],
  },
];

export function SlideNav({ open, onClose }: SlideNavProps) {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  return (
    <>
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
                <Leaf size={18} className="text-white" fill="white" fillOpacity={0.3} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                  Smart Vision <span className="text-green-600 dark:text-green-400">NPK</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{t('appTagline')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* User card */}
          {isAuthenticated && user && (
            <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email || user.phone || t('guestMode')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {sections.map((section) => (
              <div key={section.labelKey || 'main'}>
                {section.labelKey && (
                  <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {t(section.labelKey)}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map(({ path, icon: Icon, key }) => {
                    const active = location.pathname === path;
                    return (
                      <button
                        key={path}
                        onClick={() => handleNav(path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                          active
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                        {t(key)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="flex items-center gap-3">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                {isDark ? t('darkMode') : 'Light Mode'}
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors relative ${isDark ? 'bg-green-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-4 left-0.5' : 'translate-x-0.5 left-0'}`} />
              </div>
            </button>

            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <Shield size={20} />
              {language === 'en' ? 'Kiswahili' : 'English'}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut size={20} />
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
