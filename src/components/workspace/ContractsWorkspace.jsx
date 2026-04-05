import { useContext, useEffect, useState } from 'react';
import { FileSignature, Upload, ShieldCheck, Sparkles, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
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
  const [selectedContract, setSelectedContract] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let active = true;
    if (!businessInfo?.id) { setContracts([]); setLoading(false); return; }
    setLoading(true);
    api.listContracts()
      .then((rows) => { if (active) { setContracts(Array.isArray(rows) ? rows : []); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Failed to load contracts'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessInfo?.id]);

  const totalProtectedValue = contracts.reduce((sum, c) => sum + Number(c.total_value || 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) { setError('Attach a contract file before saving.'); return; }
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
      setContracts((cur) => [created, ...cur]);
      setForm(INITIAL_FORM);
      setFile(null);
    } catch (e) {
      setError(e.message || 'Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async (contract) => {
    if (!businessInfo?.id) return;
    setAnalyzing(true);
    setSelectedContract(contract);
    try {
      // For now, use the contract metadata as context since we can't extract PDF text client-side easily
      const contractText = `Contract: ${contract.file_name}\nType: ${contract.contract_type}\nCounterparty: ${contract.counterparty_name}\nEffective: ${contract.effective_date || 'N/A'}\nExpires: ${contract.expiration_date || 'N/A'}\nValue: ${contract.total_value || 'N/A'}`;
      const analysis = await api.analyzeContract({
        contractText,
        businessId: businessInfo.id,
        contractId: contract.id,
      });
      // Update the contract in local state with analysis
      setContracts((cur) => cur.map((c) =>
        c.id === contract.id ? { ...c, analysis: JSON.stringify(analysis), health_score: analysis.healthScore, obligations: JSON.stringify(analysis.obligations || []) } : c
      ));
      setSelectedContract({ ...contract, _analysis: analysis });
    } catch (e) {
      setError(e.message || 'Contract analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const parsedAnalysis = selectedContract?._analysis || tryParseJSON(selectedContract?.analysis);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel-strong rounded-[30px] p-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Contracts</p>
          <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Centralize signed work and renewals</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
            Upload contracts for AI analysis — get health scores, obligation tracking, clause breakdowns, and missing protection alerts.
          </p>
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
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">AI analysis</p>
              <p className="mt-2 text-sm text-text-primary">Click any contract to run AI clause analysis.</p>
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
              <p className="mt-1 text-sm leading-6 text-text-secondary">Upload and register contract metadata.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <input value={form.counterpartyName} onChange={(e) => setForm((c) => ({ ...c, counterpartyName: e.target.value }))} placeholder="Counterparty name" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.contractType} onChange={(e) => setForm((c) => ({ ...c, contractType: e.target.value }))} className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary">
                <option value="service">Service agreement</option>
                <option value="vendor">Vendor agreement</option>
                <option value="lease">Lease</option>
                <option value="insurance">Insurance support doc</option>
              </select>
              <input value={form.totalValue} onChange={(e) => setForm((c) => ({ ...c, totalValue: e.target.value }))} placeholder="Total value" type="number" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.effectiveDate} onChange={(e) => setForm((c) => ({ ...c, effectiveDate: e.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
              <input value={form.expirationDate} onChange={(e) => setForm((c) => ({ ...c, expirationDate: e.target.value }))} type="date" className="control-input rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary" />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-gap">{error}</p>}
          <RippleButton type="submit" variant="primary" size="lg" disabled={saving} className="mt-5 w-full">
            {saving ? 'Saving...' : 'Upload and save contract'}
          </RippleButton>
        </form>
      </div>

      {/* Contract detail / analysis panel */}
      {selectedContract && parsedAnalysis && (
        <ContractAnalysisPanel
          contract={selectedContract}
          analysis={parsedAnalysis}
          onClose={() => setSelectedContract(null)}
        />
      )}

      {/* Contract list */}
      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Tracked agreements</p>
            <p className="mt-1 text-sm text-text-secondary">Click a contract to view AI analysis.</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-text-secondary">Loading contracts...</p>
        ) : contracts.length ? (
          <div className="mt-6 grid gap-3">
            {contracts.map((contract) => (
              <article key={contract.id} className="surface-panel cursor-pointer rounded-3xl p-4 transition-all hover:border-primary/20" onClick={() => {
                const existing = tryParseJSON(contract.analysis);
                if (existing?.clauses) {
                  setSelectedContract({ ...contract, _analysis: existing });
                } else {
                  handleAnalyze(contract);
                }
              }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{contract.counterparty_name || contract.file_name}</p>
                      {contract.health_score && (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${Number(contract.health_score) >= 70 ? 'bg-covered/10 text-covered' : Number(contract.health_score) >= 40 ? 'bg-warning/10 text-warning' : 'bg-gap/10 text-gap'}`}>
                          {contract.health_score}%
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{contract.contract_type} · {contract.status}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                    {analyzing && selectedContract?.id === contract.id ? (
                      <span className="flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary"><Sparkles className="h-3 w-3" /> Analyze</span>
                    )}
                    <span>{contract.total_value ? formatCurrency(Number(contract.total_value)) : ''}</span>
                    <a href={contract.file_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>Open file</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">No contracts yet.</p>
        )}
      </div>
    </section>
  );
}

function ContractAnalysisPanel({ contract, analysis, onClose }) {
  const [expandedClause, setExpandedClause] = useState(null);

  return (
    <div className="glass-card rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-primary">{contract.counterparty_name || contract.file_name}</p>
          <p className="mt-1 text-sm text-text-secondary">{analysis.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          {analysis.healthScore && (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium ${Number(analysis.healthScore) >= 70 ? 'bg-covered/10 text-covered' : Number(analysis.healthScore) >= 40 ? 'bg-warning/10 text-warning' : 'bg-gap/10 text-gap'}`}>
              {analysis.healthScore}
            </div>
          )}
          <button type="button" onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary">Close</button>
        </div>
      </div>

      {/* Clauses */}
      {analysis.clauses?.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-text-secondary">Clauses</p>
          <div className="space-y-2">
            {analysis.clauses.map((clause, i) => (
              <div key={clause.id || i} className="surface-panel overflow-hidden rounded-2xl">
                <button type="button" onClick={() => setExpandedClause(expandedClause === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${clause.risk === 'high' ? 'bg-gap' : clause.risk === 'medium' ? 'bg-warning' : 'bg-covered'}`} />
                    <span className="text-sm text-text-primary">{clause.title}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${expandedClause === i ? 'rotate-180' : ''}`} />
                </button>
                {expandedClause === i && (
                  <div className="border-t border-white/5 px-4 pb-3 pt-2">
                    <p className="text-sm text-text-secondary">{clause.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obligations */}
      {analysis.obligations?.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-text-secondary">Obligations</p>
          <div className="space-y-2">
            {analysis.obligations.map((ob, i) => (
              <div key={ob.id || i} className="surface-panel rounded-2xl p-3">
                <p className="text-sm font-medium text-text-primary">{ob.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{ob.description}</p>
                <div className="mt-2 flex gap-3 text-xs text-text-secondary/70">
                  {ob.dueDate && <span>Due: {ob.dueDate}</span>}
                  <span>Party: {ob.party}</span>
                  <span className={ob.status === 'pending' ? 'text-warning' : 'text-covered'}>{ob.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing protections */}
      {analysis.missingProtections?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" /> Missing Protections
          </p>
          <ul className="mt-2 space-y-1">
            {analysis.missingProtections.map((p, i) => (
              <li key={i} className="text-sm text-warning/80">• {p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-text-secondary">Recommendations</p>
          <ul className="space-y-1">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-text-secondary">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function tryParseJSON(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
}
