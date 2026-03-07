/** Render a numeric value as Indian Rupees, e.g. ₹1,23,456.78 */
export const fmtCurrency = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return '—';
  return `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

/** Render ISO date string as "04 Mar '26" */
export const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
};

/**
 * Parse various raw date strings into YYYY-MM-DD.
 * Handles: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
 */
export const parseDate = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD MMM YYYY  e.g. "04 Mar 2026"
  const dMonthY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dMonthY) {
    const monthMap = {
      jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
      jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    };
    const [, d, mon, y] = dMonthY;
    const m = monthMap[mon.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
  }

  // Native fallback
  const dt = new Date(s);
  return isNaN(dt) ? null : dt.toISOString().split('T')[0];
};

/**
 * Filter a transaction list by a dateRange object:
 *   { preset: '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL' | 'CUSTOM', from?, to? }
 */
export const filterByDateRange = (transactions, range) => {
  if (!range || range.preset === 'ALL') return transactions;

  const presetMonths = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '2Y': 24 };

  let start = null;
  let end   = range.to ? new Date(range.to) : null;

  if (range.preset !== 'CUSTOM') {
    const months = presetMonths[range.preset];
    if (months == null) return transactions;
    start = new Date();
    start.setMonth(start.getMonth() - months);
  } else {
    start = range.from ? new Date(range.from) : null;
  }

  return transactions.filter((t) => {
    const d = new Date(t.tx_date);
    if (start && d < start) return false;
    if (end   && d > end)   return false;
    return true;
  });
};
