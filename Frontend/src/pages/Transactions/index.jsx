import { useState, useMemo, useCallback } from 'react';
import { api }   from '../../lib/api';
import { toast } from '../../lib/toast';
import { filterByDateRange } from '../../lib/formatters';
import { PAGE_SIZE_OPTIONS } from '../../constants';
import { Button, Pagination, Select } from '../../components/ui';
import Filters    from './Filters';
import TableView  from './TableView';
import CSVUpload  from './CSVUpload';

const DEFAULT_FILTERS = {
  search:       '',
  type:         'all',    // 'all' | 'cr' | 'dr'
  categoryId:   '',
  merchantId:   '',
  dateRange:    { preset: 'ALL', from: null, to: null },
  minAmount:    '',
  maxAmount:    '',
  ignoreStatus: 'all',   // 'all' | 'active' | 'ignored'
};

const DEFAULT_SORT = { field: 'tx_date', dir: 'desc' };

// ─────────────────────────────────────────────────────────────
// Bulk Actions bar (shown when rows selected)
// ─────────────────────────────────────────────────────────────
function BulkActions({ count, categories, onIgnore, onAttach, onClear, loading }) {
  const [catId, setCatId] = useState('');

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-overlay border-b border-edge flex-wrap">
      <span className="font-mono text-[11px] text-accent font-semibold">{count} selected</span>

      <div className="flex items-center gap-1.5">
        <Select value={catId} onChange={(e) => setCatId(e.target.value)} className="!w-44 !text-xs !py-1">
          <option value="">Tag category…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button size="xs" variant="primary" disabled={!catId || loading}
          onClick={() => { onAttach(catId); setCatId(''); }}>
          Apply
        </Button>
      </div>

      <Button size="xs" disabled={loading} onClick={() => onIgnore(true)}>Ignore</Button>
      <Button size="xs" disabled={loading} onClick={() => onIgnore(false)}>Unignore</Button>
      <Button size="xs" variant="ghost" onClick={onClear}>Clear</Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Transactions Page
// ─────────────────────────────────────────────────────────────
export default function Transactions({ transactions, categories, merchants, refresh }) {
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [sort,        setSort]        = useState(DEFAULT_SORT);
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCSV,     setShowCSV]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  const catMap   = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const merchMap = useMemo(() => Object.fromEntries(merchants.map((m) => [m.id, m])),  [merchants]);

  // ── Filter ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = filterByDateRange(transactions, filters.dateRange);

    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((t) => {
        const mName = t.merchant_id ? (merchMap[t.merchant_id]?.name ?? '').toLowerCase() : '';
        return t.particulars?.toLowerCase().includes(s) || mName.includes(s);
      });
    }
    if (filters.type === 'cr')  list = list.filter((t) =>  t.tx_type);
    if (filters.type === 'dr')  list = list.filter((t) => !t.tx_type);
    if (filters.categoryId)     list = list.filter((t) => String(t.category_id) === filters.categoryId);
    if (filters.merchantId)     list = list.filter((t) => String(t.merchant_id)  === filters.merchantId);
    if (filters.minAmount)      list = list.filter((t) => parseFloat(t.amount) >= parseFloat(filters.minAmount));
    if (filters.maxAmount)      list = list.filter((t) => parseFloat(t.amount) <= parseFloat(filters.maxAmount));
    if (filters.ignoreStatus === 'active')  list = list.filter((t) => !t.ignore);
    if (filters.ignoreStatus === 'ignored') list = list.filter((t) =>  t.ignore);

    return list;
  }, [transactions, filters, merchMap]);

  // ── Sort ───────────────────────────────────────────────────
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av, bv;
    switch (sort.field) {
      case 'amount':   av = parseFloat(a.amount); bv = parseFloat(b.amount); break;
      case 'merchant': av = (merchMap[a.merchant_id]?.name ?? '').toLowerCase(); bv = (merchMap[b.merchant_id]?.name ?? '').toLowerCase(); break;
      case 'category': av = (catMap[a.category_id]?.name   ?? '').toLowerCase(); bv = (catMap[b.category_id]?.name   ?? '').toLowerCase(); break;
      default:         av = a.tx_date; bv = b.tx_date; break;
    }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ?  1 : -1;
    return 0;
  }), [filtered, sort, catMap, merchMap]);

  // ── Paginate ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  // ── Handlers ───────────────────────────────────────────────
  const handleFilterChange = useCallback((update) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSort = useCallback((field) => {
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }, []);

  const toggleSelect    = useCallback((id)  => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]), []);
  const toggleSelectAll = useCallback(()    => setSelectedIds((p) => p.length === paginated.length ? [] : paginated.map((t) => t.id)), [paginated]);

  const handleIgnore = async (ignore) => {
    if (!selectedIds.length) return;
    setLoading(true);
    const res = await api.put('/ignore_transaction', { tx_ids: selectedIds, ignore });
    toast[res.success ? 'success' : 'error'](res.message);
    setSelectedIds([]);
    await refresh(true);
    setLoading(false);
  };

  const handleAttachCategory = async (catId) => {
    if (!selectedIds.length || !catId) return;
    setLoading(true);
    const res = await api.put('/attach_category', { tx_ids: selectedIds, category_id: parseInt(catId) });
    toast[res.success ? 'success' : 'error'](res.message);
    setSelectedIds([]);
    await refresh(true);
    setLoading(false);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* CSV toggle */}
      <div className="flex justify-end">
        <Button variant={showCSV ? 'primary' : 'default'} onClick={() => setShowCSV((v) => !v)}>
          ↑ {showCSV ? 'Hide Import' : 'Import CSV'}
        </Button>
      </div>

      {showCSV && (
        <CSVUpload onSuccess={() => { refresh(true); setShowCSV(false); }} />
      )}

      <Filters
        filters={filters}
        onChange={handleFilterChange}
        categories={categories}
        merchants={merchants}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setSelectedIds([]); }}
      />

      <div className="bg-surface-card border border-edge rounded-md overflow-hidden">
        {selectedIds.length > 0 && (
          <BulkActions
            count={selectedIds.length}
            categories={categories}
            onIgnore={handleIgnore}
            onAttach={handleAttachCategory}
            onClear={() => setSelectedIds([])}
            loading={loading}
          />
        )}

        <TableView
          rows={paginated}
          catMap={catMap}
          merchMap={merchMap}
          sort={sort}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleSelectAll}
          allSelected={selectedIds.length === paginated.length && paginated.length > 0}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </div>
  );
}
