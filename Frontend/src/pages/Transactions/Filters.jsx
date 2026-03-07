import { useState } from 'react';
import { clsx } from 'clsx';
import { Button, Input, Select } from '../../components/ui';
import { DATE_PRESETS } from '../../constants';

export default function Filters({ filters, onChange, categories, merchants, onReset }) {
  const [expanded, setExpanded] = useState(false);

  const isCustomDate = filters.dateRange.preset === 'CUSTOM';

  const hasActive =
    filters.search ||
    filters.type !== 'all' ||
    filters.categoryId ||
    filters.merchantId ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.ignoreStatus !== 'all' ||
    filters.dateRange.preset !== 'ALL';

  const setDate = (update) => onChange({ dateRange: { ...filters.dateRange, ...update } });

  return (
    <div className="bg-surface-card border border-edge rounded-md overflow-hidden">
      {/* ── Primary row ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <Input
          placeholder="Search particulars or merchant…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="max-w-[260px] !text-xs"
        />

        {/* Date preset buttons */}
        <div className="flex bg-surface-elevated border border-edge rounded overflow-hidden flex-shrink-0">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange({ dateRange: { preset: p.label, from: null, to: null } })}
              className={clsx(
                'px-2.5 py-1.5 font-mono text-[11px] border-r border-edge last:border-r-0 transition-colors',
                filters.dateRange.preset === p.label
                  ? 'bg-accent text-surface-base font-semibold'
                  : 'text-ink-mid hover:text-ink-bright hover:bg-surface-overlay',
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => onChange({ dateRange: { preset: 'CUSTOM', from: filters.dateRange.from, to: filters.dateRange.to } })}
            className={clsx(
              'px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              isCustomDate ? 'bg-accent text-surface-base font-semibold' : 'text-ink-mid hover:text-ink-bright hover:bg-surface-overlay',
            )}
          >
            Custom
          </button>
        </div>

        {isCustomDate && (
          <div className="flex items-center gap-2">
            <input type="date" value={filters.dateRange.from ?? ''}
              onChange={(e) => setDate({ from: e.target.value || null })}
              className="bg-surface-elevated border border-edge-hi rounded text-ink-bright text-xs px-2.5 py-1.5 outline-none focus:border-accent font-mono"
            />
            <span className="text-ink-dim text-xs">→</span>
            <input type="date" value={filters.dateRange.to ?? ''}
              onChange={(e) => setDate({ to: e.target.value || null })}
              className="bg-surface-elevated border border-edge-hi rounded text-ink-bright text-xs px-2.5 py-1.5 outline-none focus:border-accent font-mono"
            />
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '▲' : '▼'} {expanded ? 'Fewer' : 'More filters'}
            {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block ml-0.5" />}
          </Button>
          {hasActive && (
            <Button size="sm" variant="ghost" onClick={onReset}>Reset</Button>
          )}
        </div>
      </div>

      {/* ── Expanded row ── */}
      {expanded && (
        <div className="flex items-center gap-3 px-4 pb-3 pt-3 border-t border-edge bg-surface-elevated flex-wrap">
          <Select value={filters.type} onChange={(e) => onChange({ type: e.target.value })} className="!w-28 !text-xs">
            <option value="all">All Types</option>
            <option value="cr">Credit only</option>
            <option value="dr">Debit only</option>
          </Select>

          <Select value={filters.categoryId} onChange={(e) => onChange({ categoryId: e.target.value })} className="!w-44 !text-xs">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <Select value={filters.merchantId} onChange={(e) => onChange({ merchantId: e.target.value })} className="!w-44 !text-xs">
            <option value="">All Merchants</option>
            {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>

          {/* Amount range */}
          <div className="flex items-center gap-1.5">
            <Input placeholder="Min ₹" type="number" value={filters.minAmount}
              onChange={(e) => onChange({ minAmount: e.target.value })}
              className="!w-24 !text-xs font-mono"
            />
            <span className="text-ink-dim text-xs">–</span>
            <Input placeholder="Max ₹" type="number" value={filters.maxAmount}
              onChange={(e) => onChange({ maxAmount: e.target.value })}
              className="!w-24 !text-xs font-mono"
            />
          </div>

          <Select value={filters.ignoreStatus} onChange={(e) => onChange({ ignoreStatus: e.target.value })} className="!w-36 !text-xs">
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="ignored">Ignored only</option>
          </Select>
        </div>
      )}
    </div>
  );
}
