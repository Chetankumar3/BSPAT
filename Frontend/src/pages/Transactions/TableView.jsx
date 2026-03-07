import { clsx } from 'clsx';
import { Badge } from '../../components/ui';
import { fmtCurrency, fmtDate } from '../../lib/formatters';

const COLUMNS = [
  { key: 'tx_date',   label: 'Date',        align: 'left'  },
  { key: 'particulars', label: 'Particulars', align: 'left' },
  { key: 'merchant',  label: 'Merchant',    align: 'left'  },
  { key: 'category',  label: 'Category',    align: 'left'  },
  { key: null,         label: 'Type',        align: 'left'  },
  { key: 'amount',    label: 'Amount',      align: 'right' },
  { key: null,         label: 'Balance',     align: 'right' },
];

function SortIndicator({ colKey, sort }) {
  if (!colKey) return null;
  if (sort.field !== colKey) return <span className="text-ink-dim opacity-30 ml-1">↕</span>;
  return <span className="text-accent ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function TableView({ rows, catMap, merchMap, sort, onSort, selectedIds, onToggleSelect, onToggleAll, allSelected }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-elevated">
            {/* Checkbox */}
            <th className="w-9 px-3 py-2.5 border-b border-edge">
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="cursor-pointer accent-amber-500" />
            </th>

            {COLUMNS.map(({ key, label, align }) => (
              <th
                key={label}
                onClick={key ? () => onSort(key) : undefined}
                className={clsx(
                  'px-4 py-2.5 border-b border-edge font-mono text-[10px] uppercase tracking-widest text-ink-dim font-medium whitespace-nowrap',
                  align === 'right' && 'text-right',
                  key && 'cursor-pointer hover:text-ink-mid select-none',
                )}
              >
                {label}
                <SortIndicator colKey={key} sort={sort} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center font-mono text-xs text-ink-dim">
                no transactions match filters
              </td>
            </tr>
          )}

          {rows.map((t) => {
            const cat   = t.category_id ? catMap[t.category_id]   : null;
            const merch = t.merchant_id  ? merchMap[t.merchant_id] : null;
            const selected = selectedIds.includes(t.id);

            return (
              <tr
                key={t.id}
                className={clsx(
                  'border-b border-edge last:border-b-0 transition-colors',
                  t.ignore  ? 'opacity-35' : 'hover:bg-surface-elevated',
                  selected  && 'bg-accent-muted',
                )}
              >
                <td className="px-3 py-2.5">
                  <input type="checkbox" checked={selected} onChange={() => onToggleSelect(t.id)} className="cursor-pointer accent-amber-500" />
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-ink-mid whitespace-nowrap">
                  {fmtDate(t.tx_date)}
                </td>
                <td className="px-4 py-2.5 text-xs text-ink-mid max-w-[180px] truncate" title={t.particulars}>
                  {t.particulars || '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-ink-bright">
                  {merch ? merch.name : <span className="text-ink-dim">—</span>}
                </td>
                <td className="px-4 py-2.5">
                  {cat ? <Badge variant="cat">{cat.name}</Badge> : <Badge variant="none">untagged</Badge>}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={t.tx_type ? 'cr' : 'dr'}>{t.tx_type ? 'CR' : 'DR'}</Badge>
                </td>
                <td className={clsx('px-4 py-2.5 font-mono text-xs text-right', t.tx_type ? 'text-positive' : 'text-negative')}>
                  {fmtCurrency(t.amount)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-right text-ink-mid">
                  {fmtCurrency(t.closing_balance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
