import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useScan } from '../contexts/ScanContext';
import { getModelMetrics } from '../services/mlService';
import { Users, Brain, Database, Activity, TrendingUp, Shield, Download, RefreshCw, Settings } from 'lucide-react';

export default function AdminPanel() {
  const { t } = useLanguage();
  const { history } = useScan();
  const metrics = useMemo(() => getModelMetrics(), []);

  const kpis = [
    { icon: Users, label: t('totalUsers'), value: '1,247', sub: '+12% monthly', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: Brain, label: t('totalPredictions'), value: String(history.length), sub: 'All time', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: TrendingUp, label: t('modelAccuracy'), value: `${metrics.accuracy}%`, sub: metrics.modelVersion, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: Activity, label: t('activeToday'), value: '89', sub: 'Real-time users', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="space-y-5 pb-2 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-green-600" />
          <h2 className="text-xl font-bold text-green-700 dark:text-green-300">{t('adminPanel')}</h2>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold active:scale-95 transition-all">
          <RefreshCw size={12} /> {t('refresh')}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="glass-card rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2.5`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('adminPanel')}</h3>
        {[
          { icon: Database, label: t('manageDatasets'), desc: 'Upload, label, and manage training datasets for maize and bean leaves.' },
          { icon: Brain, label: t('updateModel'), desc: 'Fine-tune CNN ResNet-50 model with new training data and validate.' },
          { icon: Users, label: t('userStats'), desc: 'View user engagement, activity patterns, and growth analytics.' },
          { icon: Shield, label: t('manageRecommendations'), desc: 'Update fertilizer and treatment recommendations per crop.' },
          { icon: Activity, label: t('monitorPerformance'), desc: 'Track model accuracy, inference speed, and system health.' },
        ].map(({ icon: Icon, label, desc }) => (
          <button key={label} className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left tap-scale">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-white text-sm">{label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Export */}
      <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-green-600/15 transition-all active:scale-[0.98]">
        <Download size={18} /> {t('exportData')}
      </button>

      {/* Model Info */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Model Specifications</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Architecture', 'CNN ResNet-50 (Transfer Learning)'],
            ['Input', '224×224×3 RGB'],
            ['Classes', '4 (N, P, K Deficient, Healthy)'],
            ['Precision', `${metrics.precision}%`],
            ['Recall', `${metrics.recall}%`],
            ['F1 Score', `${metrics.f1Score}%`],
            ['Training Set', `${metrics.totalTrainingImages.toLocaleString()} images`],
            ['Framework', 'TensorFlow 2.15 / TFLite'],
            ['Inference', metrics.inferenceTime],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{l}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
