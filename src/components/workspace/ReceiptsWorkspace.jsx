import { useContext, useEffect, useState } from 'react';
import { Camera, Receipt, FolderOpen } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

const INITIAL_FORM = {
  vendor: '',
  amount: '',
  date: '',
  category: 'operations',
  taxNotes: '',
};

export default function ReceiptsWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!businessInfo?.id) {
      setReceipts([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.listReceipts()
      .then((rows) => {
        if (active) {
          setReceipts(Array.isArray(rows) ? rows : []);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Failed to load receipts');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [businessInfo?.id]);

  const deductibleTotal = receipts.reduce((sum, item) => sum + Number(item.deductible_amount || 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Attach a receipt image or PDF before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const uploadedFile = await api.uploadWorkspaceFile('receipts', file);
      const created = await api.createReceipt({
        uploadedFileId: uploadedFile.id,
        imageUrl: uploadedFile.blob_url,
        vendor: form.vendor,
        amount: Number(form.amount || 0),
        date: form.date || new Date().toISOString().slice(0, 10),
        category: form.category,
        taxNotes: form.taxNotes,
        deductibleAmount: Number(form.amount || 0),
      });

      setReceipts((current) => [created, ...current]);
      setForm(INITIAL_FORM);
      setFile(null);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="surface-panel-strong rounded-[30px] p-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Receipts</p>
          <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Capture operating spend without leaving SafeGuard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
            LaunchPad&apos;s receipt workflow has been restyled into the SafeGuard shell so expense capture can directly support reserves, cashflow, and compliance follow-up.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Saved receipts</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{receipts.length}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Deductible tracked</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{formatCurrency(deductibleTotal)}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Storage</p>
              <p className="mt-2 text-sm text-text-primary">Blob-backed files tied to the same business identity as quotes and contracts.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-panel rounded-[30px] p-6">
          <div className="flex items-start gap-3">
            <div className="surface-chip flex h-11 w-11 items-center justify-center rounded-2xl">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Upload a receipt</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Save the file, tag the spend category, and keep tax notes inside the workspace.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input type="file" accept="image/*,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.vendor} onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))} placeholder="Vendor" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" type="number" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary">
                <option value="operations">Operations</option>
                <option value="inventory">Inventory</option>
                <option value="marketing">Marketing</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <textarea value={form.taxNotes} onChange={(event) => setForm((current) => ({ ...current, taxNotes: event.target.value }))} rows={3} placeholder="Tax notes or follow-up reminders" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
          </div>

          {error ? <p className="mt-4 text-sm text-gap">{error}</p> : null}

          <RippleButton type="submit" variant="primary" size="lg" disabled={saving} className="mt-5 w-full">
            {saving ? 'Saving receipt...' : 'Upload and save receipt'}
          </RippleButton>
        </form>
      </div>

      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Recent receipt activity</p>
            <p className="mt-1 text-sm text-text-secondary">Every upload is attached to this business profile and available for follow-up later.</p>
          </div>
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading receipts...</p>
        ) : receipts.length ? (
          <div className="mt-6 grid gap-3">
            {receipts.map((receipt) => (
              <article key={receipt.id} className="surface-panel rounded-3xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{receipt.vendor || 'Unknown vendor'}</p>
                    <p className="mt-1 text-sm text-text-secondary">{receipt.category} · {receipt.date}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{formatCurrency(Number(receipt.amount || 0))}</span>
                    <a href={receipt.image_url} target="_blank" rel="noreferrer" className="text-primary transition-colors hover:text-primary/80">Open file</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">No receipts yet. Upload the first file to begin expense tracking.</p>
        )}
      </div>
    </section>
  );
}
