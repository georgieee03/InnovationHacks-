import { useContext, useEffect, useState } from 'react';
import { ClipboardList, BadgeCheck } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
];

export default function ComplianceWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!businessInfo?.id) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.listCompliance()
      .then((rows) => {
        if (active) {
          setItems(Array.isArray(rows) ? rows : []);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Failed to load compliance items');
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

  const completedCount = items.filter((item) => item.status === 'complete').length;

  const updateStatus = async (id, status) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));

    try {
      const updated = await api.updateCompliance(id, { status });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (updateError) {
      setError(updateError.message || 'Failed to update compliance item');
    }
  };

  return (
    <section className="space-y-6">
      <div className="surface-panel-strong rounded-[30px] p-6">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Compliance</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Turn onboarding into a living compliance checklist</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              These items are derived from your SafeGuard onboarding profile so you can keep operating obligations visible inside the same shell as risk, finance, and funding.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Checklist items</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{items.length}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Completed</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Current obligations</p>
            <p className="mt-1 text-sm text-text-secondary">Status updates persist to the authenticated workspace record.</p>
          </div>
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>

        {error ? <p className="mt-4 text-sm text-gap">{error}</p> : null}

        {loading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading compliance items...</p>
        ) : items.length ? (
          <div className="mt-6 grid gap-3">
            {items.map((item) => (
              <article key={item.id} className="surface-panel rounded-3xl p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-text-secondary">{item.jurisdiction_name} · {item.category}</p>
                  </div>
                  <div className="min-w-[180px]">
                    <select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value)} className="control-input w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary">
                      {STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                      ))}
                    </select>
                    {item.application_url ? (
                      <a href={item.application_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm text-primary transition-colors hover:text-primary/80">
                        Open resource
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">No compliance items generated yet.</p>
        )}
      </div>
    </section>
  );
}
