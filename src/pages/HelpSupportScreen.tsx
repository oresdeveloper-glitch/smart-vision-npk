import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { HelpCircle, MessageCircle, BookOpen, Mail, ChevronDown, ChevronUp, Search, ExternalLink } from 'lucide-react';

const faqs = [
  {
    q: 'How do I scan a leaf?',
    a: 'Go to the Scan page and either take a photo using your camera or upload an image from your gallery. Make sure the leaf is well-lit and clearly visible against a plain background.',
  },
  {
    q: 'What image formats are supported?',
    a: 'We support JPG, JPEG, and PNG image formats. Maximum file size is 10MB. For best results, use a clear, focused image with the leaf filling most of the frame.',
  },
  {
    q: 'How accurate is the detection?',
    a: 'Our CNN model achieves over 94% accuracy on test datasets. The confidence score shown with each result indicates how certain the model is about its prediction.',
  },
  {
    q: 'What is NPK deficiency?',
    a: 'NPK stands for Nitrogen (N), Phosphorus (P), and Potassium (K) — three essential nutrients for plant growth. Deficiencies in these nutrients cause distinct visual symptoms on leaves.',
  },
  {
    q: 'How do I use the recommendations?',
    a: 'After a scan, you\'ll receive specific fertilizer recommendations and treatment steps tailored to the detected deficiency and crop type. Follow the application rates and timing suggestions.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'The app works offline for viewing history and previous results. Image analysis requires an internet connection to communicate with the ML server.',
  },
  {
    q: 'How is my data protected?',
    a: 'Your data is encrypted and stored securely. Passwords are hashed using SHA-256. We do not share your personal information or scan data with third parties.',
  },
  {
    q: 'How do I export my results?',
    a: 'You can export individual scan results as PDF reports from the Results page. Your complete history can be exported from the History page.',
  },
];

export default function HelpSupportScreen() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="space-y-5 pb-2 animate-fade-in-up">
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300">Help & Support</h2>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" placeholder="Search FAQs..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-green-400 transition-all"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: BookOpen, label: 'User Guide', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', onClick: () => window.open('/education', '_self') },
          { icon: MessageCircle, label: 'Contact Us', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
          { icon: Mail, label: 'Send Feedback', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
          { icon: ExternalLink, label: 'Visit Website', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', onClick: () => window.open('https://smartvisionnpk.app', '_blank') },
        ].map(({ icon: Icon, label, color, bg, onClick }, i) => (
          <button key={i} onClick={onClick}
            className="glass-card rounded-2xl p-4 flex items-center gap-3 tap-scale text-left">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div>
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <HelpCircle size={18} className="text-green-600" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No matching questions found.</p>
          ) : filtered.map((faq, i) => {
            const isOpen = expanded === `faq_${i}`;
            return (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : `faq_${i}`)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm pr-4">{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact form */}
      <div id="contact">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <MessageCircle size={18} className="text-green-600" />
          Contact Us
        </h3>
        <form onSubmit={handleContact} className="glass-card rounded-2xl p-5 space-y-3">
          <input type="text" placeholder="Your Name" required value={contactForm.name}
            onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-green-400 transition-all" />
          <input type="email" placeholder="Your Email" required value={contactForm.email}
            onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-green-400 transition-all" />
          <textarea placeholder="Describe your issue or question..." required rows={4} value={contactForm.message}
            onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-green-400 transition-all resize-none" />
          <button type="submit"
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all active:scale-[0.98]">
            {sent ? '✓ Message Sent!' : 'Send Message'}
          </button>
        </form>
      </div>

      <p className="text-center text-[10px] text-slate-400 font-medium">
        {t('version')} · {t('copyright')}
      </p>
    </div>
  );
}
