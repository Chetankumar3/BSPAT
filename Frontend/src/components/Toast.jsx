import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { _register } from '../lib/toast';

export function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _register(setToasts);
    return () => _register(null);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'flex items-center gap-2.5 px-4 py-2.5 rounded bg-surface-elevated shadow-2xl',
            'font-sans text-xs text-ink-bright min-w-[260px] animate-slide-in',
            'border border-edge-hi',
            t.type === 'success' ? 'border-l-2 border-l-positive' : 'border-l-2 border-l-negative',
          )}
        >
          <span className={t.type === 'success' ? 'text-positive' : 'text-negative'}>
            {t.type === 'success' ? '✓' : '✕'}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
