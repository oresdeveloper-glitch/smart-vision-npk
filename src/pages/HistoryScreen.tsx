import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useScan, CropType, DeficiencyType } from '../contexts/ScanContext';
import { SeverityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Search, Clock, Trash2, ArrowUpRight, X } from 'lucide-react';

export default function HistoryScreen() {
  const { t } = useLanguage();
  const { history, deleteScan, clearHistory } = useScan();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCrop, setFilterCrop] = useState<CropType | ''>('');
  const [filterDef, setFilterDef] = useState<DeficiencyType | ''>('');

  const filtered = history.filter(s => {
    if (search && !s.id.toLowerCase().includes(search.toLowerCase()) &&
        !t(`${s.deficiency}Deficiency`).toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCrop && s.cropType !== filterCrop) return false;
    if (filterDef && s.deficiency !== filterDef) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('scanHistory')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{history.length} total scans</p>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearHistory}>
            Clear All
          </Button>
        )}
      </div>

      {/* Filters */}
      {history.length > 0 && (
        <div className="card-premium p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text" placeholder={t('searchHistory')} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['', 'maize', 'beans'] as const).map(v => (
              <button key={v} onClick={() => setFilterCrop(v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  filterCrop === v
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800/30 dark:text-green-300'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-green-200'
                }`}>{v ? t(v) : 'All'}</button>
            ))}
            <span className="w-px h-6 bg-[var(--color-border)] self-center" />
            {(['', 'nitrogen', 'phosphorus', 'potassium', 'healthy'] as const).map(v => (
              <button key={v} onClick={() => setFilterDef(v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  filterDef === v
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800/30 dark:text-green-300'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-green-200'
                }`}>{v ? t(`${v}Deficiency`).split(' ')[0] : 'All'}</button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock size={24} />}
          title={history.length === 0 ? t('noScans') : 'No matching results'}
          description={history.length === 0 ? t('noScansDesc') : 'Try adjusting your search or filters'}
          action={history.length === 0 ? { label: 'Scan a Leaf', onClick: () => navigate('/scan') } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((scan) => (
            <button
              key={scan.id}
              onClick={() => { navigate('/results'); }}
              className="w-full card-premium p-4 flex items-center gap-4 group hover:border-green-200 dark:hover:border-green-800/30 transition-all"
            >
              <img src={scan.imageData} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {t(`${scan.deficiency}Deficiency`)}
                  </p>
                  <SeverityBadge severity={scan.severity} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
                  <span>{scan.confidence.toFixed(1)}% confidence</span>
                  <span>·</span>
                  <span>{scan.cropType}</span>
                  <span>·</span>
                  <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteScan(scan.id); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
              <ArrowUpRight size={16} className="text-[var(--color-text-tertiary)] group-hover:text-green-600 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
