import { useLanguage } from '../contexts/LanguageContext';
import { useScan } from '../contexts/ScanContext';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BarChart3, Activity, Leaf, Droplets, Wind,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

export default function AnalyticsScreen() {
  const { t } = useLanguage();
  const { history } = useScan();

  const total = history.length;
  const healthy = history.filter(s => s.deficiency === 'healthy').length;
  const nitrogen = history.filter(s => s.deficiency === 'nitrogen').length;
  const phosphorus = history.filter(s => s.deficiency === 'phosphorus').length;
  const potassium = history.filter(s => s.deficiency === 'potassium').length;

  const deficiencyData = [
    { name: 'Healthy', value: healthy, color: '#10B981' },
    { name: 'Nitrogen', value: nitrogen, color: '#EF4444' },
    { name: 'Phosphorus', value: phosphorus, color: '#F59E0B' },
    { name: 'Potassium', value: potassium, color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayScans = history.filter(s => {
      const sd = new Date(s.timestamp);
      return sd.toDateString() === date.toDateString();
    });
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      scans: dayScans.length,
      healthy: dayScans.filter(s => s.deficiency === 'healthy').length,
      deficient: dayScans.filter(s => s.deficiency !== 'healthy').length,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass px-3 py-2 rounded-lg text-xs shadow-lg">
          <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('analytics')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Comprehensive analysis of all leaf scans</p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<BarChart3 size={24} />}
          title="No analytics data"
          description="Start scanning leaves to see trends and analytics."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Activity size={20} />} label="Total Scans" value={total} color="primary" />
            <StatCard icon={<Leaf size={20} />} label="Healthy" value={healthy} color="secondary" />
            <StatCard icon={<Droplets size={20} />} label="Nitrogen (N)" value={nitrogen} color="rose" />
            <StatCard icon={<Wind size={20} />} label="Phosphorus (P)" value={phosphorus} color="accent" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Trend chart */}
            <div className="card-premium p-5">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">7-Day Scan Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7B0F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F7B0F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" stroke="#0F7B0F" fill="url(#scanGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Deficiency Distribution */}
            <div className="card-premium p-5">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Deficiency Distribution</h2>
              {deficiencyData.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-12">No data</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={deficiencyData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                        {deficiencyData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {deficiencyData.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-[var(--color-text-secondary)] flex-1">{d.name}</span>
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly comparison */}
          <div className="card-premium p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Healthy vs Deficient</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="healthy" name="Healthy" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deficient" name="Deficient" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
