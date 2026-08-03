import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { educationArticles, EducationArticle } from '../data/education';
import { ChevronRight, X, BookOpen } from 'lucide-react';

const categories = [
  { key: 'maize', icon: '🌽' },
  { key: 'beans', icon: '🫘' },
  { key: 'fertilizer', icon: '🧪' },
  { key: 'practices', icon: '🌱' },
] as const;

export default function EducationScreen() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openArticle, setOpenArticle] = useState<EducationArticle | null>(null);

  const filtered = selectedCategory === 'all'
    ? educationArticles
    : educationArticles.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-4 pb-2 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <BookOpen size={22} className="text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-bold text-green-700 dark:text-green-300">{t('education')}</h2>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
            selectedCategory === 'all' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>📋 {t('filterAll')}</button>
        {categories.map(({ key, icon }) => (
          <button key={key} onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
              selectedCategory === key ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>{icon} {t(key === 'maize' ? 'maizeGuide' : key === 'beans' ? 'beansGuide' : key === 'fertilizer' ? 'fertilizerGuide' : 'bestPractices')}</button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-3 stagger">
        {filtered.map((article, i) => (
          <button key={article.id} onClick={() => setOpenArticle(article)}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left tap-scale animate-fade-in-up"
            style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
              {article.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{article.title[language]}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">{t('readMore')}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Modal */}
      {openArticle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setOpenArticle(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white pr-3">{openArticle.title[language]}</h2>
              <button onClick={() => setOpenArticle(null)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-all">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                {openArticle.content[language]}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
