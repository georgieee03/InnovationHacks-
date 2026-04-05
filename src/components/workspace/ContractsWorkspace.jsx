import { useContext, useEffect, useState } from 'react';
import { FileSignature, Upload, ShieldCheck } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

const INITIAL_FORM = {
  contractType: 'service',
  counterpartyName: '',
  effectiveDate: '',
  expirationDate: '',
  totalValue: '',
};

export default function ContractsWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!businessInfo?.id) {
      setContracts([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.listContracts()
      .then((rows) => {
        if (active) {
          setContracts(Array.isArray(rows) ? rows : []);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Failed to load contracts');
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

  const totalProtectedValue = contracts.reduce((sum, item) => sum + Number(item.total_value || 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Attach a contract file before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const uploadedFile = await api.uploadWorkspaceFile('contracts', file);
      const created = await api.createContract({
        uploadedFileId: uploadedFile.id,
        fileName: uploadedFile.file_name,
        fileUrl: uploadedFile.blob_url,
        fileType: file.type || 'application/pdf',
        contractType: form.contractType,
        counterpartyName: form.counterpartyName,
        effectiveDate: form.effectiveDate || null,
        expirationDate: form.expirationDate || null,
        totalValue: form.totalValue ? Number(form.totalValue) : null,
      });

      setContracts((current) => [created, ...current]);
      setForm(INITIAL_FORM);
      setFile(null);
    } catch (saveError) {
      setError(saveError.message || 'Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel-strong rounded-[30px] p-6">
          <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-text-secondary">Contracts</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Centralize signed work and renewals</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
                This SafeGuard-styled version of LaunchPad contracts keeps file storage, counterparty tracking, renewal dates, and value visibility in the main shell.
              </p>
            </div>
            <div className="surface-chip flex h-12 w-12 items-center justify-center rounded-2xl">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Live contracts</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{contracts.length}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Tracked value</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{formatCurrency(totalProtectedValue)}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Workspace fit</p>
              <p className="mt-2 text-sm text-text-primary">Uses SafeGuard onboarding data, Auth0 identity, and Blob-backed files.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-panel rounded-[30px] p-6">
          <div className="flex items-start gap-3">
            <div className="surface-chip flex h-11 w-11 items-center justify-center rounded-2xl">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Add a contract</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Upload to Vercel Blob, then register the contract metadata inside the merged workspace.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <input value={form.counterpartyName} onChange={(event) => setForm((current) => ({ ...current, counterpartyName: event.target.value }))} placeholder="Counterparty name" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.contractType} onChange={(event) => setForm((current) => ({ ...current, contractType: event.target.value }))} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary">
                <option value="service">Service agreement</option>
                <option value="vendor">Vendor agreement</option>
                <option value="lease">Lease</option>
                <option value="insurance">Insurance support doc</option>
              </select>
              <input value={form.totalValue} onChange={(event) => setForm((current) => ({ ...current, totalValue: event.target.value }))} placeholder="Total value" type="number" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.effectiveDate} onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <input value={form.expirationDate} onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-gap">{error}</p> : null}

          <RippleButton type="submit" variant="primary" size="lg" disabled={saving} className="mt-5 w-full">
            {saving ? 'Saving contract...' : 'Upload and save contract'}
          </RippleButton>
        </form>
      </div>

      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Tracked agreements</p>
            <p className="mt-1 text-sm text-text-secondary">Renewals, counterparties, and file links stay anchored to this business profile.</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading contracts...</p>
        ) : contracts.length ? (
          <div className="mt-6 grid gap-3">
            {contracts.map((contract) => (
              <article key={contract.id} className="surface-panel rounded-3xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{contract.counterparty_name || contract.file_name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{contract.contract_type} · {contract.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                    <span>{contract.effective_date || 'No start date'}</span>
                    <span>{contract.expiration_date || 'No renewal date'}</span>
                    <span>{contract.total_value ? formatCurrency(Number(contract.total_value)) : 'No value set'}</span>
                    <a href={contract.file_url} target="_blank" rel="noreferrer" className="text-primary transition-colors hover:text-primary/80">Open file</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">No contracts yet. Upload the first agreement to start the workspace.</p>
        )}
      </div>
    </section>
  );
}
