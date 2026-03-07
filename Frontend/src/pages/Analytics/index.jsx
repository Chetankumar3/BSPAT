import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../../components/ui';
import { fmtCurrency, filterByDateRange } from '../../lib/formatters';
import { DATE_PRESETS, CHART_COLORS } from '../../constants';

// ─────────────────────────────────────────────────────────────
// DateRangeFilter
// ─────────────────────────────────────────────────────────────
function DateRangeFilter({ value, onChange }) {
  const isCustom = value.preset === 'CUSTOM';
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex bg-surface-elevated border border-edge rounded overflow-hidden">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ preset: p.label, from: null, to: null })}
            className={clsx(
              'px-3 py-1.5 font-mono text-[11px] border-r border-edge last:border-r-0 transition-colors',
              value.preset === p.label
                ? 'bg-accent text-surface-base font-semibold'
                : 'text-ink-mid hover:text-ink-bright hover:bg-surface-overlay',
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onChange({ preset: 'CUSTOM', from: value.from, to: value.to })}
          className={clsx(
            'px-3 py-1.5 font-mono text-[11px] transition-colors',
            isCustom ? 'bg-accent text-surface-base font-semibold' : 'text-ink-mid hover:text-ink-bright hover:bg-surface-overlay',
          )}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input type="date" value={value.from ?? ''}
            onChange={(e) => onChange({ ...value, from: e.target.value || null })}
            className="bg-surface-elevated border border-edge-hi rounded text-ink-bright text-xs px-2.5 py-1.5 outline-none focus:border-accent font-mono"
          />
          <span className="text-ink-dim text-xs">→</span>
          <input type="date" value={value.to ?? ''}
            onChange={(e) => onChange({ ...value, to: e.target.value || null })}
            className="bg-surface-elevated border border-edge-hi rounded text-ink-bright text-xs px-2.5 py-1.5 outline-none focus:border-accent font-mono"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chart helpers
// ─────────────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <div className="bg-surface-card border border-edge rounded-md p-5">
    <h3 className="section-heading font-mono text-[10px] uppercase tracking-widest text-ink-mid mb-4">{title}</h3>
    {children}
  </div>
);

const Empty = () => (
  <p className="text-center font-mono text-xs text-ink-dim py-10">no data in range</p>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-edge-hi rounded px-3 py-2 text-[11px] font-mono shadow-xl">
      <p className="text-ink-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-edge-hi rounded px-3 py-2 text-[11px] font-mono shadow-xl">
      <p className="text-ink-mid">{payload[0].name}</p>
      <p className="text-accent">{fmtCurrency(payload[0].value)}</p>
    </div>
  );
};

const axisStyle  = { tick: { fill: '#5c6370', fontSize: 10, fontFamily: 'IBM Plex Mono' } };
const gridStyle  = { strokeDasharray: '3 3', stroke: '#252932' };
const legendStyle = { wrapperStyle: { fontSize: 11, fontFamily: 'IBM Plex Mono' } };

// ─────────────────────────────────────────────────────────────
// Analytics Page
// ─────────────────────────────────────────────────────────────
export default function Analytics({ transactions, categories }) {
  const [dateRange, setDateRange] = useState({ preset: '3M', from: null, to: null });

  const catMap  = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const filtered = useMemo(() => filterByDateRange(transactions, dateRange), [transactions, dateRange]);
  const active   = useMemo(() => filtered.filter((t) => !t.ignore), [filtered]);

  const totalIn  = useMemo(() => active.filter((t) =>  t.tx_type).reduce((s, t) => s + parseFloat(t.amount), 0), [active]);
  const totalOut = useMemo(() => active.filter((t) => !t.tx_type).reduce((s, t) => s + parseFloat(t.amount), 0), [active]);
  const latestBalance = transactions.length > 0 ? parseFloat(transactions.at(-1).closing_balance) : 0;
  const uncategorized = active.filter((t) => !t.tx_type && !t.category_id).length;

  const pieData = useMemo(() => {
    const map = {};
    active.filter((t) => !t.tx_type && t.category_id).forEach((t) => {
      const name = catMap[t.category_id]?.name ?? 'Unknown';
      map[name] = (map[name] ?? 0) + parseFloat(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [active, catMap]);

  const monthlyData = useMemo(() => {
    const map = {};
    active.forEach((t) => {
      const d = new Date(t.tx_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: key, income: 0, spent: 0 };
      if (t.tx_type) map[key].income += parseFloat(t.amount);
      else           map[key].spent  += parseFloat(t.amount);
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, income: +m.income.toFixed(2), spent: +m.spent.toFixed(2) }));
  }, [active]);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-heading font-mono text-[11px] uppercase tracking-widest text-ink-mid">Overview</h2>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Income"    value={fmtCurrency(totalIn)}     sub={`${active.filter((t) =>  t.tx_type).length} credits`}  accent="green" />
        <StatCard label="Total Spent"     value={fmtCurrency(totalOut)}    sub={`${active.filter((t) => !t.tx_type).length} debits`}   accent="red"   />
        <StatCard label="Current Balance" value={fmtCurrency(latestBalance)} sub="latest closing"                                     accent="amber" />
        <StatCard label="Uncategorized"   value={uncategorized}            sub="need tagging"  accent={uncategorized > 0 ? 'red' : 'blue'} />
      </div>

      {/* Area + Pie row */}
      <div className="grid grid-cols-2 gap-3">
        <ChartCard title="Spending Over Time">
          {monthlyData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3ecf8e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f06060" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f06060" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="month" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip content={<ChartTooltip />} />
                <Legend {...legendStyle} />
                <Area type="monotone" dataKey="income" stroke="#3ecf8e" fill="url(#gIncome)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="spent"  stroke="#f06060" fill="url(#gSpent)"  strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Spend by Category">
          {pieData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="40%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" {...legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Monthly bar */}
      <ChartCard title="Monthly Comparison">
        {monthlyData.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip content={<ChartTooltip />} />
              <Legend {...legendStyle} />
              <Bar dataKey="income" fill="#3ecf8e" radius={[2, 2, 0, 0]} opacity={0.85} />
              <Bar dataKey="spent"  fill="#f06060" radius={[2, 2, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
