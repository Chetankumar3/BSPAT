import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export function TopBar({ tabs }) {
  return (
    <header className="bg-surface-card border-b border-edge sticky top-0 z-50 flex items-stretch h-12">
      {/* Logo */}
      <div className="flex items-center px-6 border-r border-edge flex-shrink-0">
        <span className="font-mono text-xs font-semibold text-accent tracking-widest uppercase">
          Ledger <span className="text-ink-dim font-normal tracking-normal">/ v1</span>
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-stretch ml-1 gap-0.5">
        {tabs.map((t) => (
          <NavLink
            key={t.id}
            to={`/${t.id}`}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-4 text-xs font-medium border-b-2 transition-colors',
                isActive
                  ? 'text-accent border-accent'
                  : 'text-ink-mid border-transparent hover:text-ink-bright hover:border-edge-hi',
              )
            }
          >
            <span className="text-sm opacity-70">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="ml-auto flex items-center gap-2 px-6">
        <div className="w-1.5 h-1.5 rounded-full bg-positive shadow-[0_0_6px_#3ecf8e] animate-pulse" />
        <span className="font-mono text-[10px] text-ink-dim">api:8000</span>
      </div>
    </header>
  );
}