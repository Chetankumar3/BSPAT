import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { api }   from '../../lib/api';
import { toast } from '../../lib/toast';
import { parseDate, fmtCurrency } from '../../lib/formatters';
import { Button } from '../../components/ui';
import { clsx } from 'clsx';

// ─────────────────────────────────────────────────────────────
// Column detection
// ─────────────────────────────────────────────────────────────
const ALIASES = {
  tx_date:     ['tx_date','date','transaction date','value date','posting date','txn date','txdate','trans date'],
  particulars: ['particulars','description','narration','remarks','details','transaction details','txn description','trans description'],
  withdrawal:  ['withdrawal','debit','dr','amount dr','debit amount','withdrawals','dr amount','amt dr'],
  deposit:     ['deposit','credit','cr','amount cr','credit amount','deposits','cr amount','amt cr'],
  balance:     ['balance','closing balance','running balance','available balance','bal','avl bal'],
};

const detectColumn = (headers, field) => {
  const lower = headers.map((h) => String(h).trim().toLowerCase());
  return lower.findIndex((h) => ALIASES[field].includes(h));
};

// ─────────────────────────────────────────────────────────────
// Row normalisation
// ─────────────────────────────────────────────────────────────
const normalise = (rawRow, mapping) => {
  const get = (f) => {
    const idx = mapping[f];
    return idx >= 0 ? String(rawRow[idx] ?? '').trim() : '';
  };

  const clean = (s) => s.replace(/,/g, '');
  const toNum = (s) => { const n = parseFloat(clean(s)); return isNaN(n) || s === '' ? null : n; };

  return {
    tx_date:     parseDate(get('tx_date')),
    particulars: get('particulars'),
    balance:     toNum(get('balance')),
    withdrawal:  toNum(get('withdrawal')),
    deposit:     toNum(get('deposit')),
  };
};

const isValid = (row) => row.tx_date && row.particulars && row.balance !== null;

// ─────────────────────────────────────────────────────────────
// CSVUpload component
// ─────────────────────────────────────────────────────────────
export default function CSVUpload({ onSuccess }) {
  const [parsed,   setParsed]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file?.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        if (data.length < 2) { toast.error('CSV appears empty'); return; }

        const headers = data[0].map((h) => String(h).trim());
        const mapping = Object.fromEntries(
          Object.keys(ALIASES).map((f) => [f, detectColumn(headers, f)])
        );
        const normalised = data.slice(1).map((row) => normalise(row, mapping));
        setParsed({ headers, mapping, normalised });
      },
      error: (err) => toast.error(`Parse error: ${err.message}`),
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleInput = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  const validRows    = parsed?.normalised.filter(isValid) ?? [];
  const invalidCount = (parsed?.normalised.length ?? 0) - validRows.length;

  const handleUpload = async () => {
    if (!validRows.length) return;
    setLoading(true);
    try {
      const res = await api.post('/add_raw_transaction', validRows);
      toast[res.success ? 'success' : 'error'](res.message);
      if (res.success) { setParsed(null); onSuccess(); }
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-card border border-edge rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-edge bg-surface-elevated">
        <span className="section-heading font-mono text-[10px] uppercase tracking-widest text-ink-mid">Import CSV</span>
        {parsed && <Button size="xs" variant="ghost" onClick={() => setParsed(null)}>✕ Clear</Button>}
      </div>

      <div className="p-5 space-y-4">
        {!parsed ? (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-colors',
                dragOver ? 'border-accent bg-accent-muted' : 'border-edge-hi hover:border-ink-dim',
              )}
            >
              <p className="font-mono text-xs text-ink-mid mb-1">Drop .csv here  or  click to browse</p>
              <p className="text-[11px] text-ink-dim">Columns: tx_date · particulars · balance · withdrawal / deposit</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleInput} />
            </div>

            {/* Format hint */}
            <div className="bg-surface-elevated border border-edge rounded p-4">
              <p className="font-mono text-[10px] text-ink-dim uppercase tracking-widest mb-2">Expected format</p>
              <pre className="text-[11px] text-ink-mid font-mono leading-relaxed">
{`tx_date,particulars,withdrawal,deposit,balance
04/03/2026,UPIAR/2323/DR/CHANDRAP/YESB,500.00,,9500.00
05/03/2026,NEFT/CR/SALARY,,50000.00,59500.00`}
              </pre>
              <p className="text-[11px] text-ink-dim mt-3">
                Accepted date formats: <span className="text-ink-mid">DD/MM/YYYY</span> · <span className="text-ink-mid">DD-MM-YYYY</span> · <span className="text-ink-mid">YYYY-MM-DD</span> · <span className="text-ink-mid">DD MMM YYYY</span>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Column mapping */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {Object.entries(parsed.mapping).map(([field, idx]) => (
                <div key={field} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-ink-dim uppercase">{field}</span>
                  <span className="text-ink-dim text-xs">→</span>
                  <span className={clsx('font-mono text-[11px]', idx >= 0 ? 'text-positive' : 'text-negative')}>
                    {idx >= 0 ? parsed.headers[idx] : 'not found'}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center gap-5 font-mono text-xs">
              <span className="text-ink-mid">{parsed.normalised.length} rows parsed</span>
              <span className="text-positive">✓ {validRows.length} valid</span>
              {invalidCount > 0 && <span className="text-negative">✕ {invalidCount} invalid (skipped)</span>}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto border border-edge rounded">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-elevated">
                    {['Date','Particulars','Withdrawal','Deposit','Balance','✓'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-ink-dim border-b border-edge whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.normalised.slice(0, 10).map((row, i) => {
                    const valid = isValid(row);
                    return (
                      <tr key={i} className={clsx('border-b border-edge last:border-0', !valid && 'opacity-35')}>
                        <td className="px-3 py-1.5 font-mono text-xs text-ink-mid">{row.tx_date ?? '—'}</td>
                        <td className="px-3 py-1.5 text-xs text-ink-bright max-w-[200px] truncate">{row.particulars || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-negative">{row.withdrawal != null ? fmtCurrency(row.withdrawal) : '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-positive">{row.deposit    != null ? fmtCurrency(row.deposit)    : '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-ink-mid">{row.balance     != null ? fmtCurrency(row.balance)    : '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">
                          {valid ? <span className="text-positive">✓</span> : <span className="text-negative">✕</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {parsed.normalised.length > 10 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 font-mono text-[11px] text-ink-dim text-center">
                        … and {parsed.normalised.length - 10} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setParsed(null)}>Cancel</Button>
              <Button variant="primary" disabled={validRows.length === 0 || loading} onClick={handleUpload}>
                {loading ? 'Uploading…' : `Upload ${validRows.length} transaction${validRows.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
