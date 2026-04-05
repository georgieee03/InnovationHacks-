import { useContext, useEffect, useState } from 'react';
import { ReceiptText, Send, ArrowUpRight } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

const INITIAL_FORM = {
  clientName: '',
  clientEmail: '',
  services: '',
  subtotal: '',
  taxRate: '0.0825',
  scheduledDate: '',
};

export default function QuotesWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!businessInfo?.id) {
      setQuotes([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.listQuotes()
      .then((rows) => {
        if (active) {
          setQuotes(Array.isArray(rows) ? rows : []);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Failed to load quotes');
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

  const sentQuotes = quotes.filter((quote) => quote.status === 'sent').length;
  const pipelineValue = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const subtotal = Number(form.subtotal || 0);
    const taxRate = Number(form.taxRate || 0);
    const taxAmount = subtotal * taxRate;

    try {
      const created = await api.createQuote({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        services: form.services,
        subtotal,
        taxRate,
        taxAmount,
        total: subtotal + taxAmount,
        scheduledDate: form.scheduledDate || null,
        status: 'draft',
      });

      setQuotes((current) => [created, ...current]);
      setForm(INITIAL_FORM);
    } catch (saveError) {
      setError(saveError.message || 'Failed to create quote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="surface-panel-strong rounded-[30px] p-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Quotes</p>
          <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Move from pricing idea to scheduled work</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
            SafeGuard keeps the UI shell, but the quote workflow now mirrors LaunchPad&apos;s revenue motion: package services, track value, and keep the pipeline visible beside risk and finance.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Open quotes</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{quotes.length}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Sent</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{sentQuotes}</p>
            </div>
            <div className="surface-panel rounded-3xl p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Pipeline</p>
              <p className="mt-2 text-2xl font-light text-text-primary">{formatCurrency(pipelineValue)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-panel rounded-[30px] p-6">
          <div className="flex items-start gap-3">
            <div className="surface-chip flex h-11 w-11 items-center justify-center rounded-2xl">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Create a quote</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Use onboarding context as the starting profile, then capture the customer and service package.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} placeholder="Client name" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <input value={form.clientEmail} onChange={(event) => setForm((current) => ({ ...current, clientEmail: event.target.value }))} placeholder="Client email" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <textarea value={form.services} onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))} placeholder="One service per line" rows={4} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={form.subtotal} onChange={(event) => setForm((current) => ({ ...current, subtotal: event.target.value }))} placeholder="Subtotal" type="number" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <input value={form.taxRate} onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))} placeholder="Tax rate" type="number" step="0.0001" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <input value={form.scheduledDate} onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-gap">{error}</p> : null}

          <RippleButton type="submit" variant="primary" size="lg" disabled={saving} className="mt-5 w-full">
            {saving ? 'Saving quote...' : 'Save quote draft'}
          </RippleButton>
        </form>
      </div>

      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Quote pipeline</p>
            <p className="mt-1 text-sm text-text-secondary">Quote totals now live inside the same workspace as receipts, funding, and financial risk analysis.</p>
          </div>
          <ReceiptText className="h-5 w-5 text-primary" />
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading quotes...</p>
        ) : quotes.length ? (
          <div className="mt-6 grid gap-3">
            {quotes.map((quote) => (
              <article key={quote.id} className="surface-panel rounded-3xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{quote.client_name || 'Untitled quote'}</p>
                    <p className="mt-1 text-sm text-text-secondary">{quote.status} · {quote.scheduled_date || 'Unscheduled'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-text-secondary">{formatCurrency(Number(quote.total || 0))}</span>
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">No quotes yet. Save the first draft to start the revenue pipeline.</p>
        )}
      </div>
    </section>
  );
}
