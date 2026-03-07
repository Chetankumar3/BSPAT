import { useEffect } from 'react';

export function Modal({ title, children, onClose, actions }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-up"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-card border border-edge-hi rounded-lg p-6 w-[440px] max-w-[90vw] shadow-2xl">
        <h2 className="section-heading font-mono text-[11px] uppercase tracking-widest text-ink-bright mb-5">
          {title}
        </h2>
        <div className="space-y-3">{children}</div>
        {actions && (
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-edge">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
