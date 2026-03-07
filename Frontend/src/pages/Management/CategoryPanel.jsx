import { useState } from 'react';
import { api }   from '../../lib/api';
import { toast } from '../../lib/toast';
import { Button, Input, Field } from '../../components/ui';
import { Modal }  from '../../components/Modal';

const EMPTY_FORM = { name: '', string_id: '', description: '', color: '#f0a500' };

export default function CategoryPanel({ categories, refresh }) {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [loading,    setLoading]    = useState(false);

  const patch     = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const patchEdit = (key) => (e) => setEditTarget((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const res = await api.post('/add_category', form);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) { setForm(EMPTY_FORM); await refresh(true); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    const res = await api.delete('/delete_category', { id });
    toast[res.success ? 'success' : 'error'](res.message);
    await refresh(true);
    setLoading(false);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setLoading(true);
    const res = await api.put('/edit_category', editTarget);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) { setEditTarget(null); await refresh(true); }
    setLoading(false);
  };

  return (
    <div className="bg-surface-card border border-edge rounded-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-edge bg-surface-elevated">
        <span className="section-heading font-mono text-[10px] uppercase tracking-widest text-ink-mid">
          Categories
        </span>
        <span className="font-mono text-[10px] text-ink-dim border border-edge px-2 py-0.5 rounded">
          {categories.length}
        </span>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-80">
        {categories.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-ink-dim">no categories yet</p>
        ) : (
          categories.map((c) => (
            <div key={c.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-edge last:border-b-0 hover:bg-surface-elevated transition-colors"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color ?? '#252932' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-bright truncate">{c.name}</p>
                {c.description && <p className="text-[11px] text-ink-dim truncate">{c.description}</p>}
              </div>
              {c.string_id && (
                <span className="font-mono text-[10px] text-ink-dim border border-edge px-1.5 py-0.5 rounded">
                  {c.string_id}
                </span>
              )}
              <Button size="xs" variant="ghost"  onClick={() => setEditTarget({ ...c })}>✎</Button>
              <Button size="xs" variant="danger" onClick={() => handleDelete(c.id)} disabled={loading}>✕</Button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div className="border-t border-edge bg-surface-elevated px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-3">Add Category</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <Input value={form.name} onChange={patch('name')} placeholder="Groceries" />
          </Field>
          <Field label="Short ID">
            <Input value={form.string_id} onChange={patch('string_id')} placeholder="GRC" maxLength={3} />
          </Field>
          <Field label="Description" className="col-span-2">
            <Input value={form.description} onChange={patch('description')} placeholder="Optional" />
          </Field>
          <Field label="Color">
            <input type="color" value={form.color} onChange={patch('color')}
              className="h-9 w-full rounded border border-edge-hi bg-surface-elevated cursor-pointer px-1" />
          </Field>
          <Field label=" ">
            <Button variant="primary" onClick={handleAdd} disabled={!form.name.trim() || loading} className="w-full justify-center">
              + Add
            </Button>
          </Field>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal
          title="Edit Category"
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
            <Field label="Description" className="col-span-2">
              <Input value={editTarget.description ?? ''} onChange={patchEdit('description')} />
            </Field>
            <Field label="Color">
              <input type="color" value={editTarget.color ?? '#f0a500'} onChange={patchEdit('color')}
                className="h-9 w-full rounded border border-edge-hi bg-surface-elevated cursor-pointer px-1" />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
