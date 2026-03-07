import { useState, useEffect, useCallback } from 'react';
import { api }   from '../lib/api';
import { toast } from '../lib/toast';

/**
 * Central data hook.  Pass `silent = true` to refresh without showing
 * the full-page loading state (used after mutations).
 */
export function useData() {
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [merchants,    setMerchants]     = useState([]);
  const [loading,      setLoading]       = useState(true);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [txs, cats, merchs] = await Promise.all([
        api.get('/get_all_transaction'),
        api.get('/get_all_category'),
        api.get('/get_all_merchant'),
      ]);
      setTransactions(Array.isArray(txs)    ? txs    : []);
      setCategories(  Array.isArray(cats)   ? cats   : []);
      setMerchants(   Array.isArray(merchs) ? merchs : []);
    } catch {
      toast.error('Cannot reach backend — is it running on :8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { transactions, categories, merchants, loading, refresh };
}
