let _setter  = null;
let _counter = 0;

/** Called once by <Toast /> on mount to register its state setter. */
export const _register = (fn) => { _setter = fn; };

const push = (msg, type) => {
  if (!_setter) { console.warn('[toast]', type, msg); return; }
  const id = ++_counter;
  _setter((prev) => [...prev, { id, msg, type }]);
  setTimeout(() => _setter((prev) => prev.filter((t) => t.id !== id)), 3500);
};

export const toast = {
  success: (msg) => push(msg, 'success'),
  error:   (msg) => push(msg, 'error'),
};
