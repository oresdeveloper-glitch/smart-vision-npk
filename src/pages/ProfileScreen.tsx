import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useScan } from '../contexts/ScanContext';
import { IMAGES } from '../data/images';
import { Mail, Phone, Shield, Award, Camera, Edit3, Check, Leaf, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { history } = useScan();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  if (!user) return null;

  const handleSave = () => { updateUser({ name, phone }); setEditing(false); };
  const roleIcons: Record<string, string> = { farmer: '👨‍🌾', expert: '🔬', researcher: '📚', admin: '⚙️', guest: '👤' };
  const healthy = history.filter(s => s.deficiency === 'healthy').length;
  const healthRate = history.length ? Math.round((healthy / history.length) * 100) : 0;

  return (
    <div className="space-y-5 pb-2 animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('profile')}</h2>

      {/* Profile Card - Tanzanian woman farmer background */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-green-200/30 dark:shadow-black/20">
        <img src={IMAGES.tanzaniaWoman1} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/60 to-green-950/92" />
        <div className="relative p-6 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-white text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <Camera size={14} className="text-white" />
            </button>
          </div>

          {editing ? (
            <div className="w-full mt-5 space-y-2">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full text-center py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold outline-none focus:border-green-400 placeholder-white/30 text-sm" placeholder={t('name')} />
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-center py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none focus:border-green-400 placeholder-white/30" placeholder={t('phone')} />
              <button onClick={handleSave} className="w-full py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <Check size={16} /> {t('save')}
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-white mt-4">{user.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span>{roleIcons[user.role]}</span>
                <span className="text-white/60 text-sm">{t(user.role === 'admin' ? 'adminRole' : user.role)}</span>
              </div>
              <button onClick={() => setEditing(true)} className="mt-4 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95">
                <Edit3 size={12} /> {t('updateProfile')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {[
          { icon: Mail, label: t('email'), value: user.email || '—' },
          { icon: Phone, label: t('phone'), value: user.phone || '—' },
          { icon: Shield, label: t('role'), value: t(user.role === 'admin' ? 'adminRole' : user.role) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-4 flex items-center gap-3">
            <Icon size={18} className="text-slate-400" />
            <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{value}</p></div>
          </div>
        ))}
      </div>

      {/* Stats - Orange accent */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center">
          <Leaf size={20} className="mx-auto mb-1.5 text-green-600" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{history.length}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{t('totalScans')}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <Award size={20} className="mx-auto mb-1.5 text-green-600" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{healthRate}%</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{t('plantHealth')}</p>
        </div>
      </div>

      {(user.role === 'admin' || user.role === 'expert') && (
        <button onClick={() => navigate('/admin')} className="w-full p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 flex items-center justify-between active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-green-600" />
            <span className="font-bold text-green-700 dark:text-green-300 text-sm">{t('adminPanel')}</span>
          </div>
          <ChevronRight size={16} className="text-green-500" />
        </button>
      )}

      <button onClick={() => navigate('/settings')} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between active:scale-[0.98] transition-all">
        <div className="flex items-center gap-3">
          <LogOut size={18} className="text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{t('settings')}</span>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </button>
    </div>
  );
}
