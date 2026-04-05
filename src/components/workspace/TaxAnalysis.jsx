import { useContext, useState } from 'react';
import { Calculator, Loader2, ChevronDown, AlertTriangle, TrendingDown } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

const priorityColor = {
  high: 'bg-gap/10 text-gap border-gap/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-covered/10 text-covered border-covered/20',
};

export default function TaxAnalysis() {
  const { businessInfo } = useContext(AppContext);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDeduction, setExpandedDeduction] = useState(null);

  const handleAnalyze = async () => {
    if (!businessInfo?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.analyzeTaxes({ businessId: businessInfo.id });
      setResult(data);
    } catch (e) {
      setError(e.message || 'Tax analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Tax Analysis</p>
            <h3 className="mt-2 text-xl font-heading font-light text-text-primary">Find missed deductions and tax savings</h3>
            <p className="mt-2 text-sm text-text-secondary">
              AI analyzes your receipts and transactions to identify deductions you might be missing.
            </p>
          </div>
          <RippleButton variant="primary" size="md" onClick={handleAnalyze} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Calculator className="mr-2 h-4 w-4" /> Analyze Taxes</>}
          </RippleButton>
        </div>
        {loading && (
          <div className="mt-6 space-y-2">
            {['Scanning receipts', 'Analyzing transactions', 'Finding missed deductions'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> {step}
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-4 text-sm text-gap">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="surface-panel-strong rounded-[30px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Tax Analysis Results</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{result.summary}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Estimated savings</p>
            <p className="mt-1 text-3xl font-light text-covered">{formatCurrency(result.totalEstimatedSavings || 0)}</p>
          </div>
        </div>

        {result.entityAdvice && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm text-primary">{result.entityAdvice}</p>
          </div>
        )}

        <RippleButton variant="secondary" size="sm" onClick={handleAnalyze} disabled={loading} className="mt-4">
          {loading ? 'Re-analyzing...' : 'Re-analyze'}
        </RippleButton>
      </div>

      {/* Missed deductions */}
      {result.missedDeductions?.length > 0 && (
        <div className="surface-panel rounded-[30px] p-6">
          <p className="mb-4 text-sm font-medium text-text-primary">Missed Deductions</p>
          <div className="space-y-2">
            {result.missedDeductions
              .sort((a, b) => { const order = { high: 0, medium: 1, low: 2 }; return (order[a.priority] ?? 2) - (order[b.priority] ?? 2); })
              .map((d, i) => (
                <div key={i} className="surface-panel overflow-hidden rounded-2xl">
                  <button type="button" onClick={() => setExpandedDeduction(expandedDeduction === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${priorityColor[d.priority] || ''}`}>{d.priority}</span>
                      <span className="text-sm text-text-primary">{d.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-covered">{formatCurrency(d.estimatedAnnualSavings || 0)}/yr</span>
                      <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${expandedDeduction === i ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {expandedDeduction === i && (
                    <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3">
                      <p className="text-sm text-text-secondary">{d.description}</p>
                      {d.evidenceFromData && (
                        <div className="rounded-xl bg-white/[0.03] p-3">
                          <p className="text-xs text-text-secondary/70">Evidence from your data:</p>
                          <p className="mt-1 text-sm text-text-secondary">{d.evidenceFromData}</p>
                        </div>
                      )}
                      <div className="rounded-xl bg-primary/5 p-3">
                        <p className="text-xs text-primary/70">How to claim:</p>
                        <p className="mt-1 text-sm text-primary/80">{d.howToClaim}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-text-secondary/70">
                        {d.irsForm && <span>Form: {d.irsForm}</span>}
                        <span>Difficulty: {d.difficulty}</span>
                        <span>Deduction: {formatCurrency(d.estimatedDeductionAmount || 0)}</span>
                      </div>
                      {d.documentationNeeded?.length > 0 && (
                        <div>
                          <p className="text-xs text-text-secondary/70">Documentation needed:</p>
                          <ul className="mt-1 space-y-0.5">
                            {d.documentationNeeded.map((doc, j) => (
                              <li key={j} className="text-xs text-text-secondary">• {doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action items */}
      {result.actionItems?.length > 0 && (
        <div className="surface-panel rounded-[30px] p-6">
          <p className="mb-4 text-sm font-medium text-text-primary">Action Items</p>
          <div className="space-y-2">
            {result.actionItems.map((item, i) => (
              <div key={i} className="surface-panel rounded-2xl p-3">
                <p className="text-sm text-text-primary">{item.action}</p>
                <div className="mt-2 flex gap-3 text-xs text-text-secondary/70">
                  {item.deadline && <span>Deadline: {item.deadline}</span>}
                  <span>Impact: {item.estimatedImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
