import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useScan } from '../contexts/ScanContext';
import { generatePDF, generateHistoryReport } from '../services/pdfService';
import { FileText, Download, BarChart3, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function ReportsScreen() {
  const { t } = useLanguage();
  const { history } = useScan();
  const [generating, setGenerating] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = history.length;
    const healthy = history.filter(s => s.deficiency === 'healthy').length;
    const deficient = total - healthy;
    const defCounts: Record<string, number> = {};
    history.forEach(s => {
      if (s.deficiency !== 'healthy') defCounts[s.deficiency] = (defCounts[s.deficiency] || 0) + 1;
    });
    const topDef = Object.entries(defCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, healthy, deficient, topDef };
  }, [history]);

  const handleExportSingle = async (scan: typeof history[0]) => {
    setGenerating(scan.id);
    try {
      await generatePDF(scan);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
    setGenerating(null);
  };

  const handleExportAll = async () => {
    setGenerating('all');
    try {
      await generateHistoryReport(history);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-5 pb-2 animate-fade-in-up">
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300">Reports</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
            <BarChart3 size={18} className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total Analyses</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.deficient}</p>
          <p className="text-[11px] text-slate-500 font-medium">Deficiencies Found</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.healthy}</p>
          <p className="text-[11px] text-slate-500 font-medium">Healthy Crops</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
            <FileText size={18} className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{history.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Reports Available</p>
        </div>
      </div>

      {/* Export buttons */}
      {history.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Export Reports</h3>
          <button onClick={handleExportAll} disabled={generating === 'all'}
            className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {generating === 'all' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Export All History as PDF
          </button>
        </div>
      )}

      {/* Recent scans with individual export */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <FileText size={32} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="font-bold text-slate-500 dark:text-slate-400">No reports available</p>
          <p className="text-sm text-slate-400 mt-1">Complete a leaf scan to generate reports.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Recent Scans</h3>
          {history.slice(0, 20).map((scan) => (
            <div key={scan.id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5">
              <img src={scan.imageData} alt="Leaf" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                  {t(`${scan.deficiency}Deficiency`)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {scan.confidence.toFixed(1)}% · {t(scan.cropType)} · {new Date(scan.timestamp).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => handleExportSingle(scan)} disabled={generating === scan.id}
                className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                {generating === scan.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
