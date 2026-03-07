import { useState } from 'react';
import { api }   from '../../lib/api';
import { toast } from '../../lib/toast';
import { Button, Input, Select, Field } from '../../components/ui';
import { Modal } from '../../components/Modal';

const EMPTY_FORM = { name: '', string_id: '', category_id: '', description: '', color: '#5b8af0', ignore: false };

export default function MerchantPanel({ merchants, categories, refresh }) {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [loading,    setLoading]    = useState(false);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const patch     = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const patchEdit = (key) => (e) => setEditTarget((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.category_id) return;
    setLoading(true);
    const res = await api.post('/add_merchant', { ...form, category_id: parseInt(form.category_id) });
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) { setForm(EMPTY_FORM); await refresh(true); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    const res = await api.delete('/delete_merchant', { id });
    toast[res.success ? 'success' : 'error'](res.message);
    await refresh(true);
    setLoading(false);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setLoading(true);
    const res = await api.put('/edit_merchant', editTarget);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) { setEditTarget(null); await refresh(true); }
    setLoading(false);
  };

  return (
    <div className="bg-surface-card border border-edge rounded-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-edge bg-surface-elevated">
        <span className="section-heading font-mono text-[10px] uppercase tracking-widest text-ink-mid">
          Merchants
        </span>
        <span className="font-mono text-[10px] text-ink-dim border border-edge px-2 py-0.5 rounded">
          {merchants.length}
        </span>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-80">
        {merchants.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-ink-dim">no merchants yet</p>
        ) : (
          merchants.map((m) => (
            <div key={m.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-edge last:border-b-0 hover:bg-surface-elevated transition-colors"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color ?? '#252932' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-bright truncate">{m.name}</p>
                <p className="text-[11px] text-ink-dim">
                  {catMap[m.category_id]?.name ?? 'No category'}
                  {m.ignore && <span className="text-negative ml-2">• ignored</span>}
                </p>
              </div>
              {m.string_id && (
                <span className="font-mono text-[10px] text-ink-dim border border-edge px-1.5 py-0.5 rounded">
                  {m.string_id}
                </span>
              )}
              <Button size="xs" variant="ghost"  onClick={() => setEditTarget({ ...m })}>✎</Button>
              <Button size="xs" variant="danger" onClick={() => handleDelete(m.id)} disabled={loading}>✕</Button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div className="border-t border-edge bg-surface-elevated px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-3">Add Merchant</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <Input value={form.name} onChange={patch('name')} placeholder="Amazon" />
          </Field>
          <Field label="Short ID">
            <Input value={form.string_id} onChange={patch('string_id')} placeholder="AMZ" maxLength={3} />
          </Field>
          <Field label="Category *" className="col-span-2">
            <Select value={form.category_id} onChange={patch('category_id')}>
              <option value="">— select category —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Description" className="col-span-2">
            <Input value={form.description} onChange={patch('description')} placeholder="Optional" />
          </Field>
          <Field label="Color">
            <input type="color" value={form.color} onChange={patch('color')}
              className="h-9 w-full rounded border border-edge-hi bg-surface-elevated cursor-pointer px-1" />
          </Field>
          <Field label="Ignore">
            <label className="flex items-center gap-2 h-9 cursor-pointer">
              <input type="checkbox" checked={form.ignore}
                onChange={(e) => setForm((f) => ({ ...f, ignore: e.target.checked }))}
                className="accent-amber-500 w-4 h-4" />
              <span className="text-xs text-ink-mid">Skip all transactions</span>
            </label>
          </Field>
          <div className="col-span-2 flex justify-end">
            <Button variant="primary" onClick={handleAdd} disabled={!form.name.trim() || !form.category_id || loading}>
              + Add
            </Button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal
          title="Edit Merchant"
          onClose={() => setEditTarget(null)}
          actions={<>
            <Button onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave} disabled={loading}>Save</Button>
          </>}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={editTarget.name ?? ''} onChange={patchEdit('name')} />
            </Field>
            <Field label="Short ID">
              <Input value={editTarget.string_id ?? ''} onChange={patchEdit('string_id')} maxLength={3} />
            </Field>
            <Field label="Category" className="col-span-2">
              <Select value={editTarget.category_id ?? ''}
                onChange={(e) => setEditTarget((f) => ({ ...f, category_id: parseInt(e.target.value) }))}>
                <option value="">— select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Description" className="col-span-2">
              <Input value={editTarget.description ?? ''} onChange={patchEdit('description')} />
            </Field>
            <Field label="Color">
              <input type="color" value={editTarget.color ?? '#5b8af0'} onChange={patchEdit('color')}
                className="h-9 w-full rounded border border-edge-hi bg-surface-elevated cursor-pointer px-1" />
            </Field>
            <Field label="Ignore">
              <label className="flex items-center gap-2 h-9 cursor-pointer">
                <input type="checkbox" checked={editTarget.ignore ?? false}
                  onChange={(e) => setEditTarget((f) => ({ ...f, ignore: e.target.checked }))}
                  className="accent-amber-500 w-4 h-4" />
                <span className="text-xs text-ink-mid">Skip all transactions</span>
              </label>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
