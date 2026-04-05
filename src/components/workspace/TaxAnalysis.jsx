import { useContext, useState } from 'react';
import { DollarSign, Loader2, ChevronDown, ExternalLink, Sparkles, Search } from 'lucide-react';
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
  const [webOpps, setWebOpps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [expandedDeduction, setExpandedDeduction] = useState(null);
  const [expandedOpp, setExpandedOpp] = useState(null);

  const handleAnalyze = async () => {
    if (!businessInfo?.id) return;
    setLoading(true); setError('');
    try {
      const data = await api.analyzeTaxes({ businessId: businessInfo.id });
      setResult(data);
    } catch (e) { setError(e.message || 'Tax analysis failed'); }
    finally { setLoading(false); }
  };

  const handleWebScan = async () => {
    if (!businessInfo?.id) return;
    setScanning(true); setError('');
    try {
      const data = await api.scanTaxOpportunities({ businessId: businessInfo.id });
      setWebOpps(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (e) { setError(e.message || 'Web scan failed'); }
    finally { setScanning(false); }
  };

  if (!result) {
    return (
      <div className="space-y-4">
        <div className="surface-panel rounded-[30px] p-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Tax Analysis</p>
          <h3 className="mt-2 text-xl font-heading font-light text-text-primary">Find missed deductions and tax savings</h3>
          <p className="mt-2 text-sm text-text-secondary">
            AI analyzes your receipts and transactions to identify deductions you might be missing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <RippleButton variant="primary" size="md" onClick={handleAnalyze} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><DollarSign className="mr-2 h-4 w-4" />Analyze My Taxes</>}
            </RippleButton>
            <RippleButton variant="secondary" size="md" onClick={handleWebScan} disabled={scanning}>
              {scanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanning web...</> : <><Search className="mr-2 h-4 w-4" />Scan for Tax Opportunities</>}
            </RippleButton>
          </div>
          {loading && (
            <div className="mt-5 space-y-2">
              {['Scanning receipts', 'Analyzing transactions', 'Finding missed deductions', 'Checking entity structure'].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> {step}
                </div>
              ))}
            </div>
          )}
          {scanning && (
            <div className="mt-5 space-y-2">
              {['Searching IRS publications', 'Scanning state tax exemptions', 'Finding industry-specific deductions', 'Checking eligibility'].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> {step}
                </div>
              ))}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-gap">{error}</p>}
        </div>

        {webOpps.length > 0 && <WebOpportunitiesPanel opps={webOpps} expanded={expandedOpp} setExpanded={setExpandedOpp} businessInfo={businessInfo} />}
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
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Estimated savings</p>
            <p className="mt-1 text-3xl font-light text-covered">{formatCurrency(result.totalEstimatedSavings || 0)}</p>
          </div>
        </div>
        {result.entityAdvice && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm text-primary">{result.entityAdvice}</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <RippleButton variant="secondary" size="sm" onClick={handleAnalyze} disabled={loading}>{loading ? 'Re-analyzing...' : 'Re-analyze'}</RippleButton>
          <RippleButton variant="secondary" size="sm" onClick={handleWebScan} disabled={scanning}>
            {scanning ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Scanning...</> : <><Search className="mr-1.5 h-3.5 w-3.5" />Scan Web for More</>}
          </RippleButton>
        </div>
        {error && <p className="mt-3 text-sm text-gap">{error}</p>}
      </div>

      {/* Missed deductions */}
      {result.missedDeductions?.length > 0 && (
        <div className="surface-panel rounded-[30px] p-6">
          <p className="mb-4 text-sm font-medium text-text-primary">Missed Deductions</p>
          <div className="space-y-2">
            {result.missedDeductions
              .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
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
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Web-scraped opportunities */}
      {webOpps.length > 0 && <WebOpportunitiesPanel opps={webOpps} expanded={expandedOpp} setExpanded={setExpandedOpp} businessInfo={businessInfo} />}

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

function WebOpportunitiesPanel({ opps, expanded, setExpanded, businessInfo }) {
  return (
    <div className="surface-panel rounded-[30px] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-text-primary">Tax Opportunities Found on the Web</p>
        <span className="ml-auto text-xs text-text-secondary">{opps.length} results</span>
      </div>
      <div className="space-y-2">
        {opps.map((opp, i) => (
          <div key={i} className="surface-panel overflow-hidden rounded-2xl">
            <button type="button" onClick={() => setExpanded(expanded === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs ${opp.eligibilityScore >= 70 ? 'bg-covered/10 text-covered border-covered/20' : opp.eligibilityScore >= 40 ? 'bg-warning/10 text-warning border-warning/20' : 'bg-white/5 text-text-secondary border-white/10'}`}>
                  {opp.eligibilityScore ?? '?'}% match
                </span>
                <span className="text-sm text-text-primary truncate">{opp.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {opp.estimatedSavings && <span className="text-sm text-covered">{opp.estimatedSavings}</span>}
                <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {expanded === i && (
              <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3">
                <p className="text-sm text-text-secondary">{opp.description}</p>
                {opp.eligibilityNotes && (
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs text-text-secondary/70">Eligibility for {businessInfo?.name}:</p>
                    <p className="mt-1 text-sm text-text-secondary">{opp.eligibilityNotes}</p>
                  </div>
                )}
                {opp.howToClaim && (
                  <div className="rounded-xl bg-primary/5 p-3">
                    <p className="text-xs text-primary/70">How to claim:</p>
                    <p className="mt-1 text-sm text-primary/80">{opp.howToClaim}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-text-secondary/70">
                  {opp.type && <span className="capitalize">{opp.type}</span>}
                  {opp.jurisdiction && <span>{opp.jurisdiction}</span>}
                  {opp.deadline && <span>Deadline: {opp.deadline}</span>}
                </div>
                {opp.sourceUrl && (
                  <a href={opp.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View source
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
