import { ReactNode, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isOnline, onConnectivityChange } from '../services/storageService';
import { getNotifications, getUnreadCount, markAsRead, clearNotifications, type Notification } from '../services/notificationService';
import {
  Leaf, Home, ScanLine, Clock, BarChart3, BookOpen, FileText,
  Settings, User, LogOut, Menu, X, Moon, Sun, Bell,
  HelpCircle, ChevronLeft, ChevronRight, BellRing, CheckCheck, Trash2, XCircle,
} from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import { BottomNav } from './BottomNav';

interface LayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType>({ sidebarOpen: true, toggleSidebar: () => {} });
export const useLayout = () => useContext(LayoutContext);

const navItems = [
  { path: '/home', icon: Home, key: 'home' },
  { path: '/scan', icon: ScanLine, key: 'scan' },
  { path: '/history', icon: Clock, key: 'history' },
  { path: '/analytics', icon: BarChart3, key: 'analytics' },
  { path: '/reports', icon: FileText, key: 'reports' },
  { path: '/education', icon: BookOpen, key: 'education' },
  { path: '/help', icon: HelpCircle, key: 'helpSupport' },
  { path: '/settings', icon: Settings, key: 'settings' },
  { path: '/profile', icon: User, key: 'profile' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [scrolled, setScrolled] = useState(false);
  const [notifList, setNotifList] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const refreshNotifs = useCallback(() => {
    setNotifList(getNotifications());
    setNotifCount(getUnreadCount());
  }, []);

  useEffect(() => { refreshNotifs(); }, [refreshNotifs]);

  useEffect(() => {
    const interval = setInterval(refreshNotifs, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifs]);

  useEffect(() => {
    if (notifOpen) setNotifOpen(false);
  }, [location.pathname]);

  const handleNotifClick = (id: string) => {
    markAsRead(id);
    refreshNotifs();
  };

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    return onConnectivityChange(setOnline);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(s => !s);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path: string) => location.pathname === path;

  return (
    <LayoutContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      <div className="min-h-screen">
        <AnimatedBackground />
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ================================================================
            SIDEBAR
            ================================================================ */}
        <aside className={`fixed top-0 left-0 z-50 h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 ease-out ${
          sidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-collapsed)]'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>

          {/* Logo */}
          <div className={`flex items-center h-16 px-4 border-b border-[var(--color-border)] ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200/30 dark:shadow-green-900/30 shrink-0">
                  <Leaf size={18} className="text-white" fill="white" fillOpacity={0.3} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] leading-tight truncate">
                    Smart Vision <span className="text-green-600 dark:text-green-400">NPK</span>
                  </p>
                  <p className="text-[9px] text-[var(--color-text-tertiary)] font-medium truncate">AI Deficiency Detection</p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <Leaf size={18} className="text-white" fill="white" fillOpacity={0.3} />
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => setMobileOpen(false)} className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-border)] transition-all">
                <X size={16} />
              </button>
            )}
          </div>

          {/* User info */}
          {isAuthenticated && user && sidebarOpen && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/8 dark:to-emerald-900/8 border border-green-100 dark:border-green-800/15">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{user.email || user.phone || 'Guest'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
            {navItems.map(({ path, icon: Icon, key }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`sidebar-link w-full ${isActive(path) ? 'active' : ''}`}
                title={!sidebarOpen ? t(key) : undefined}
              >
                <Icon size={20} strokeWidth={isActive(path) ? 2.5 : 2} className="shrink-0" />
                {sidebarOpen && (
                  <span className="truncate">{t(key)}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className={`border-t border-[var(--color-border)] p-2.5 space-y-0.5 ${!sidebarOpen && 'flex flex-col items-center'}`}>
            <button
              onClick={toggleTheme}
              className={`sidebar-link w-full ${!sidebarOpen && 'justify-center px-0'}`}
              title={!sidebarOpen ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
            >
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
              {sidebarOpen && <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
            </button>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className={`sidebar-link w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 ${!sidebarOpen && 'justify-center px-0'}`}
                title={!sidebarOpen ? t('logout') : undefined}
              >
                <LogOut size={20} />
                {sidebarOpen && <span>{t('logout')}</span>}
              </button>
            )}
            {/* Collapse toggle - desktop only */}
            <button
              onClick={toggleSidebar}
              className="sidebar-link w-full hidden lg:flex text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              {sidebarOpen && <span className="text-xs">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* ================================================================
            MAIN CONTENT
            ================================================================ */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[var(--sidebar-width)]' : 'lg:ml-[var(--sidebar-collapsed)]'}`}>
          {/* Top bar */}
          <header className={`sticky top-0 z-30 transition-all duration-300 ${
            scrolled ? 'glass' : 'bg-transparent'
          }`}>
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-all"
                >
                  <Menu size={20} />
                </button>
                {!online && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Offline
                  </div>
                )}
                {online && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </div>
                )}
              </div>

<div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-all"
                  >
                    {notifCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
                    {notifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                        {notifCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-[400px] overflow-hidden rounded-xl bg-white dark:bg-[#0F2A0F] border border-[var(--color-border)] shadow-2xl shadow-black/10 dark:shadow-black/40">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</p>
                          <div className="flex items-center gap-1">
                            {notifList.some(n => !n.read) && (
                              <button
                                onClick={() => { notifList.forEach(n => { if (!n.read) markAsRead(n.id); }); refreshNotifs(); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-border)] transition-all"
                                title="Mark all read"
                              >
                                <CheckCheck size={14} />
                              </button>
                            )}
                            {notifList.length > 0 && (
                              <button
                                onClick={() => { clearNotifications(); refreshNotifs(); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-border)] transition-all"
                                title="Clear all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[340px]">
                          {notifList.length === 0 ? (
                            <div className="flex flex-col items-center py-10 px-4 text-center">
                              <Bell size={28} className="text-[var(--color-text-tertiary)] mb-2 opacity-40" />
                              <p className="text-sm text-[var(--color-text-tertiary)]">No notifications</p>
                              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 opacity-60">You're all caught up</p>
                            </div>
                          ) : (
                            notifList.map(n => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n.id)}
                                className={`w-full text-left px-4 py-3 flex gap-3 transition-all hover:bg-[var(--color-surface-hover)] ${!n.read ? 'bg-green-50/60 dark:bg-green-900/8' : ''}`}
                              >
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'scan_reminder' ? 'bg-emerald-500' : n.type === 'fertilizer_reminder' ? 'bg-amber-500' : n.type === 'tip' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs ${!n.read ? 'font-semibold' : 'font-medium'} text-[var(--color-text-primary)]`}>{n.title}</p>
                                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{n.body}</p>
                                  <p className="text-[9px] text-[var(--color-text-tertiary)] mt-1">
                                    {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!n.read && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {isAuthenticated && user && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6 pb-24 lg:pb-6">
            <div className="max-w-7xl mx-auto page-enter">
              {children}
            </div>
          </main>

          <BottomNav />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
