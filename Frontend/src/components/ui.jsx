import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
export function Button({ children, variant = 'default', size = 'md', disabled, onClick, className, type = 'button', ...rest }) {
  const base = 'inline-flex items-center gap-1.5 rounded font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap';
  const sizes    = { xs: 'px-2 py-1 text-[11px]', sm: 'px-3 py-1.5 text-xs', md: 'px-3.5 py-2 text-xs' };
  const variants = {
    default: 'bg-surface-overlay border border-edge-hi text-ink-mid hover:border-ink-mid hover:text-ink-bright',
    primary: 'bg-accent text-surface-base font-semibold hover:bg-accent-hi',
    danger:  'border border-negative text-negative hover:bg-negative-muted',
    ghost:   'text-ink-mid hover:text-ink-bright',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={clsx(base, sizes[size], variants[variant] ?? variants.default, className)} {...rest}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────
export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'bg-surface-elevated border border-edge-hi rounded text-ink-bright text-sm px-2.5 py-1.5',
        'outline-none focus:border-accent placeholder:text-ink-dim w-full transition-colors',
        className,
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────
export function Select({ children, className, ...props }) {
  return (
    <select
      className={clsx(
        'bg-surface-elevated border border-edge-hi rounded text-ink-bright text-sm px-2.5 py-1.5',
        'outline-none focus:border-accent w-full transition-colors cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// Field  (label + child input wrapper)
// ─────────────────────────────────────────────────────────────
export function Field({ label, children, className }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = 'amber' }) {
  const bars  = { green: 'bg-positive', red: 'bg-negative', amber: 'bg-accent', blue: 'bg-info' };
  const texts = { green: 'text-positive', red: 'text-negative', amber: 'text-ink-bright', blue: 'text-ink-bright' };
  return (
    <div className="bg-surface-card border border-edge rounded-md p-4 relative overflow-hidden">
      <div className={clsx('absolute top-0 left-0 right-0 h-0.5', bars[accent] ?? bars.amber)} />
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">{label}</p>
      <p className={clsx('font-mono text-xl font-semibold', texts[accent] ?? texts.amber)}>{value}</p>
      {sub && <p className="text-[11px] text-ink-dim mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
  const variants = {
    cr:      'bg-positive-muted text-positive',
    dr:      'bg-negative-muted text-negative',
    cat:     'bg-accent-muted text-accent',
    none:    'bg-surface-overlay text-ink-dim',
    default: 'bg-surface-overlay text-ink-mid',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-wider',
      variants[variant] ?? variants.default,
    )}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, pageSizeOptions }) {
  const [inputVal, setInputVal] = useState(String(page));

  useEffect(() => setInputVal(String(page)), [page]);

  const commit = () => {
    const p = parseInt(inputVal, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) onPageChange(p);
    else setInputVal(String(page));
  };

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-edge bg-surface-card">
      <span className="font-mono text-[11px] text-ink-dim">
        {totalItems === 0 ? 'No results' : `${from}–${to} of ${totalItems}`}
      </span>

      <div className="flex items-center gap-3">
        {/* Page size */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-dim uppercase tracking-widest">Rows</span>
          <Select value={pageSize} onChange={(e) => { onPageSizeChange(Number(e.target.value)); }} className="!w-16 !text-xs !py-1">
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1">
          <Button size="xs" disabled={page <= 1}           onClick={() => onPageChange(1)}>«</Button>
          <Button size="xs" disabled={page <= 1}           onClick={() => onPageChange(page - 1)}>‹</Button>

          <div className="flex items-center gap-1.5 px-1">
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              className="w-10 bg-surface-elevated border border-edge-hi rounded text-ink-bright text-center font-mono text-xs py-0.5 outline-none focus:border-accent"
            />
            <span className="font-mono text-[11px] text-ink-dim">/ {totalPages}</span>
          </div>

          <Button size="xs" disabled={page >= totalPages}  onClick={() => onPageChange(page + 1)}>›</Button>
          <Button size="xs" disabled={page >= totalPages}  onClick={() => onPageChange(totalPages)}>»</Button>
        </div>
      </div>
    </div>
  );
}
