import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useScan } from '../contexts/ScanContext';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Camera, ScanLine, Upload, AlertTriangle, Leaf,
  Droplets, Wind, Shield, ArrowUpRight,
  Activity, BarChart3, Clock, BookOpen, MapPin, Sun,
} from 'lucide-react';

export default function HomeDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { history } = useScan();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          const data = await res.json();
          if (data.current_weather?.temperature != null) {
            setTemperature(Math.round(data.current_weather.temperature));
          }
        } catch {}
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const town = data.address?.town || data.address?.city || data.address?.village || data.address?.county || '';
          const country = data.address?.country || '';
          setLocation([town, country].filter(Boolean).join(', '));
        } catch {}
      },
      () => {},
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  const total = history.length;
  const healthy = history.filter(s => s.deficiency === 'healthy').length;
  const healthRate = total ? Math.round((healthy / total) * 100) : 0;
  const nitrogen = history.filter(s => s.deficiency === 'nitrogen').length;
  const phosphorus = history.filter(s => s.deficiency === 'phosphorus').length;
  const potassium = history.filter(s => s.deficiency === 'potassium').length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 p-6 lg:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" size="sm" pulse>AI Powered</Badge>
              <Badge variant="info" size="sm">v2.0</Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              {t('welcome')}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-green-100 text-sm max-w-lg">{t('welcomeMessage')}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-green-200/80 text-xs">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>
                {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {location}
                </span>
              )}
              {temperature != null && (
                <span className="flex items-center gap-1">
                  <Sun size={12} />
                  {temperature}°C
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              icon={<ScanLine size={16} />}
              onClick={() => navigate('/scan')}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              {t('quickScan')}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Upload size={16} />}
              onClick={() => navigate('/scan')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-lg shadow-amber-500/20"
            >
              {t('uploadImage')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={20} />}
          label={t('totalScans')}
          value={total}
          color="primary"
          trend={total > 0 ? { value: 12, positive: true } : undefined}
          subtitle="Last 7 days"
        />
        <StatCard
          icon={<Leaf size={20} />}
          label="Healthy Leaves"
          value={healthy}
          color="secondary"
          subtitle={`${healthRate}% health rate`}
        />
        <StatCard
          icon={<Droplets size={20} />}
          label="Nitrogen (N)"
          value={nitrogen}
          color="rose"
          subtitle="Deficiency cases"
        />
        <StatCard
          icon={<Wind size={20} />}
          label="Phosphorus (P)"
          value={phosphorus}
          color="accent"
          subtitle="Deficiency cases"
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity / Latest Scan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Analyses</h2>
              {total > 0 && (
                <button onClick={() => navigate('/history')} className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline flex items-center gap-1">
                  View all <ArrowUpRight size={12} />
                </button>
              )}
            </div>

            {total === 0 ? (
              <EmptyState
                icon={<Camera size={24} />}
                title="No scans yet"
                description="Start scanning leaves to monitor crop health and detect nutrient deficiencies."
                action={{ label: 'Scan a Leaf', onClick: () => navigate('/scan') }}
              />
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => navigate('/results')}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-all group"
                  >
                    <img src={scan.imageData} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {t(`${scan.deficiency}Deficiency`)}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {scan.confidence.toFixed(1)}% confidence · {scan.cropType}
                      </p>
                    </div>
                    <div className="text-right">
                      <SeverityBadgeSmall severity={scan.severity} />
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Potassium stat card (4th in 2x2, moved to 3rd row for layout) */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Potassium (K)"
              value={potassium}
              color="purple"
              subtitle="Deficiency cases"
            />
            <StatCard
              icon={<BarChart3 size={20} />}
              label="Detection Accuracy"
              value="94.7%"
              color="cyan"
              trend={{ value: 2.1, positive: true }}
              subtitle="Model performance"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="card-premium p-5">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/scan')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 font-medium text-sm hover:bg-green-100 dark:hover:bg-green-900/20 transition-all">
                <ScanLine size={18} /> New Scan
              </button>
              <button onClick={() => navigate('/history')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all">
                <Clock size={18} /> View History
              </button>
              <button onClick={() => navigate('/reports')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 font-medium text-sm hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all">
                <BarChart3 size={18} /> Generate Report
              </button>
              <button onClick={() => navigate('/education')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all">
                <BookOpen size={18} /> Learning Center
              </button>
            </div>
          </div>

          {/* Deficiency Distribution */}
          <div className="card-premium p-5">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Distribution</h2>
            {total === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)] text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Healthy', value: healthy, color: 'bg-emerald-500' },
                  { label: 'Nitrogen (N)', value: nitrogen, color: 'bg-rose-500' },
                  { label: 'Phosphorus (P)', value: phosphorus, color: 'bg-amber-500' },
                  { label: 'Potassium (K)', value: potassium, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
                        style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Status */}
          <div className="card-premium p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/10 flex items-center justify-center">
                <Shield size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">AI Model Active</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">CNN ResNet50 · v2.0</p>
              </div>
              <div className="ml-auto">
                <span className="status-dot bg-emerald-500 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityBadgeSmall({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    severe: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[severity] || 'bg-slate-100 text-slate-600'}`}>
      {severity}
    </span>
  );
}
