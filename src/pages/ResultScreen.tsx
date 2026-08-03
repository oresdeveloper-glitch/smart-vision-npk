import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useScan } from '../contexts/ScanContext';
import { Badge, SeverityBadge, DeficiencyBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressCircle } from '../components/ui/ProgressCircle';
import { EmptyState } from '../components/ui/EmptyState';
import { getRecommendation } from '../data/recommendations';
import { generatePDF } from '../services/pdfService';
import {
  Leaf, Download, RefreshCw, ScanLine, Droplets, Wind,
  AlertTriangle, CheckCircle2, FlaskConical, Sprout,
  Shield, Calendar, Beaker, BookOpen, Lightbulb, ListChecks,
} from 'lucide-react';

export default function ResultScreen() {
  const { t, language } = useLanguage();
  const { currentResult } = useScan();
  const navigate = useNavigate();

  if (!currentResult) {
    return (
      <EmptyState
        icon={<ScanLine size={28} />}
        title="No results to display"
        description="Scan a leaf first to see the AI-powered deficiency analysis results."
        action={{ label: 'Scan a Leaf', onClick: () => navigate('/scan') }}
      />
    );
  }

  const { deficiency, confidence, severity, cropType, imageData, timestamp } = currentResult;
  const isHealthy = deficiency === 'healthy';
  const lang = language as 'en' | 'sw';
  const rec = getRecommendation(deficiency, cropType);

  const deficiencyColors = {
    nitrogen: { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-900/10', text: 'text-rose-600 dark:text-rose-400', icon: Droplets, light: 'bg-rose-500/10 border-rose-500/20' },
    phosphorus: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', icon: Wind, light: 'bg-amber-500/10 border-amber-500/20' },
    potassium: { gradient: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-600 dark:text-purple-400', icon: AlertTriangle, light: 'bg-purple-500/10 border-purple-500/20' },
    healthy: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, light: 'bg-emerald-500/10 border-emerald-500/20' },
  };

  const dc = deficiencyColors[deficiency] || deficiencyColors.healthy;
  const Icon = dc.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('resultReady')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">AI analysis completed successfully</p>
        </div>
        <Badge variant="success" size="md" pulse>Completed</Badge>
      </div>

      {/* Main result card */}
      <div className="card-premium overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${dc.gradient}`} />
        <div className="p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image */}
            <div className="shrink-0">
              <div className="relative">
                <img src={imageData} alt="Analyzed leaf" className="w-36 h-36 rounded-xl object-cover shadow-md" />
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${dc.bg} border-2 border-white dark:border-[var(--color-surface)] flex items-center justify-center`}>
                  <Icon size={14} className={dc.text} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--color-text-tertiary)]">
                <Calendar size={10} />
                {new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DeficiencyBadge deficiency={deficiency} size="md" />
                  <SeverityBadge severity={severity} size="md" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-2">
                  {t(`${deficiency}Deficiency`)}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                  {cropType === 'maize' ? t('maize') : t('beans')} leaf analysis
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl ${dc.bg} border border-[var(--color-border)]`}>
                  <p className={`text-lg font-bold ${dc.text}`}>{confidence.toFixed(1)}%</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">Confidence</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--color-border)]">
                  <p className="text-lg font-bold text-[var(--color-text-primary)] capitalize">{severity}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">Severity</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--color-border)]">
                  <p className="text-lg font-bold text-[var(--color-text-primary)] capitalize">{currentResult.riskLevel}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">Risk Level</p>
                </div>
              </div>
            </div>

            {/* Confidence circle */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <ProgressCircle value={confidence} size={90} color={isHealthy ? '#10B981' : '#0F7B0F'} />
            </div>
          </div>
        </div>
      </div>

      {/* Fertilizers */}
      {rec && (
        <div className="card-premium p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Beaker size={18} className="text-green-600" />
            {t('recommendedFertilizer')}
          </h2>
          <div className="space-y-2">
            {rec.fertilizers[lang].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/60 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/20">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0 mt-0.5">
                  <FlaskConical size={14} />
                </div>
                <p className="text-sm text-[var(--color-text-primary)]">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Steps */}
      {rec && (
        <div className="card-premium p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <ListChecks size={18} className="text-green-600" />
            {t('treatmentSteps')}
          </h2>
          <ol className="space-y-2">
            {rec.treatmentSteps[lang].map((step, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--color-text-secondary)]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Prevention Measures */}
      {rec && (
        <div className="card-premium p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Shield size={18} className="text-green-600" />
            {t('preventionMeasures')}
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {rec.preventionMeasures[lang].map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/8 border border-amber-200/40 dark:border-amber-800/15">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Lightbulb size={14} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farming Tips */}
      {rec && (
        <div className="card-premium p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-green-600" />
            {t('farmingTips')}
          </h2>
          <div className="space-y-2">
            {rec.farmingTips[lang].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/8 border border-blue-200/40 dark:border-blue-800/15">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <Lightbulb size={14} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" size="lg" icon={<ScanLine size={18} />} onClick={() => navigate('/scan')} className="flex-1">
          New Scan
        </Button>
        <Button variant="outline" size="lg" icon={<Download size={18} />} onClick={() => generatePDF(currentResult)} className="flex-1">
          Export PDF
        </Button>
        <Button variant="secondary" size="lg" icon={<RefreshCw size={18} />} onClick={() => navigate('/scan')} className="flex-1">
          Re-scan
        </Button>
      </div>
    </div>
  );
}
