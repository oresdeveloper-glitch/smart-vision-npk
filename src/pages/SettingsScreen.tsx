import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Moon, Sun, Globe, Bell,
  HelpCircle, ChevronRight, LogOut,
  Info, Database, RefreshCw, Palette,
} from 'lucide-react';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: isDark ? Moon : Sun,
          label: isDark ? 'Dark Mode' : 'Light Mode',
          right: (
            <button onClick={toggleTheme} className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-green-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-5 left-0.5' : 'translate-x-0.5 left-0'}`} />
            </button>
          ),
        },
        {
          icon: Globe,
          label: t('language'),
          subtitle: language === 'en' ? 'English' : 'Kiswahili',
          right: (
            <button onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}>
              <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
            </button>
          ),
        },
        {
          icon: Palette,
          label: 'Theme Color',
          right: (
            <div className="flex gap-1">
              {['#0F7B0F', '#2ECC71', '#F4B400', '#3B82F6', '#8B5CF6'].map(c => (
                <div key={c} className="w-5 h-5 rounded-full border-2 border-white dark:border-[var(--color-surface)] shadow-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: t('notifications'),
          right: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
        },
        {
          icon: Bell,
          label: t('scanReminder'),
          right: (
            <button className={`relative w-11 h-6 rounded-full transition-colors bg-green-600`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm translate-x-5 left-0.5`} />
            </button>
          ),
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: Database,
          label: 'Export Data',
          subtitle: 'Download your scan history',
        },
        {
          icon: RefreshCw,
          label: 'Sync Data',
          subtitle: 'Last synced: Today, 10:30 AM',
          right: <Badge variant="success" size="sm" pulse>Synced</Badge>,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: t('helpSupport'), onClick: () => navigate('/help') },
        { icon: Info, label: t('aboutSystem'), subtitle: 'Version 2.0.0' },
      ],
    },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('settings')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your application preferences</p>
      </div>

      {/* Profile card */}
      {isAuthenticated && user && (
        <button onClick={() => navigate('/profile')} className="w-full card-premium p-4 flex items-center gap-4 group hover:border-green-200 dark:hover:border-green-800/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{user.email || user.phone || 'Guest'}</p>
          </div>
          <ChevronRight size={16} className="text-[var(--color-text-tertiary)] group-hover:text-green-600 transition-all" />
        </button>
      )}

      {/* Settings sections */}
      {sections.map(section => (
        <div key={section.title} className="card-premium overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">{section.title}</p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  onClick={'onClick' in item ? (item as any).onClick : undefined}
                  className={`flex items-center gap-3 px-5 py-3.5 ${'onClick' in item ? 'cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                    {'subtitle' in item && (item as any).subtitle && (
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">{(item as any).subtitle}</p>
                    )}
                  </div>
                  {'right' in item ? (item as any).right : (
                    'onClick' in item && <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      {isAuthenticated && (
        <Button variant="ghost" size="lg" icon={<LogOut size={18} />} onClick={handleLogout} className="w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10">
          {t('logout')}
        </Button>
      )}

      <p className="text-center text-[10px] text-[var(--color-text-tertiary)] pb-4">{t('version')} · {t('copyright')}</p>
    </div>
  );
}
