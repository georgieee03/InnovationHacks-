import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/apiClient';

const CONTRACT_TYPES = [
  { value: 'service_agreement', label: 'Service Agreement', description: 'Client hires you to perform services', color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50' },
  { value: 'vendor_agreement', label: 'Vendor Agreement', description: 'Manage suppliers & vendor relationships', color: 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50' },
  { value: 'nda', label: 'Non-Disclosure Agreement', description: 'Protect confidential information', color: 'border-white/10 bg-white/[0.03] hover:border-white/20' },
  { value: 'independent_contractor', label: 'Independent Contractor', description: 'Hire freelancers or 1099 contractors', color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50' },
  { value: 'subcontractor_agreement', label: 'Subcontractor Agreement', description: 'Pass work to another contractor', color: 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50' },
  { value: 'retainer_agreement', label: 'Monthly Retainer', description: 'Ongoing monthly service agreement', color: 'border-covered/30 bg-covered/5 hover:border-covered/50' },
  { value: 'equipment_rental', label: 'Equipment Rental', description: 'Rent equipment to or from someone', color: 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50' },
  { value: 'partnership_agreement', label: 'Partnership Agreement', description: 'Define roles in a joint venture', color: 'border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50' },
];

const PAYMENT_SCHEDULES = [
  { value: 'upfront', label: '100% upfront' },
  { value: '50-50', label: '50% deposit, 50% on completion' },
  { value: 'net15', label: 'Net-15' },
  { value: 'net30', label: 'Net-30' },
  { value: 'monthly', label: 'Monthly billing' },
  { value: 'milestone', label: 'Milestone-based' },
];

const DURATION_OPTIONS = [
  { value: 'one_time', label: 'One-time project' },
  { value: '1_month', label: '1 month' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' },
  { value: '1_year', label: '1 year' },
  { value: 'ongoing', label: 'Ongoing' },
];

const NOTICE_OPTIONS = [
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

const OPTIONAL_CLAUSES = [
  { id: 'confidentiality', label: 'Confidentiality / NDA clause', default: true },
  { id: 'photo_rights', label: 'Photo & marketing rights', default: true },
  { id: 'change_orders', label: 'Change order process', default: true },
  { id: 'dispute_resolution', label: 'Dispute resolution (mediation first)', default: true },
  { id: 'warranty_disclaimer', label: 'Warranty disclaimer', default: false },
  { id: 'non_solicitation', label: 'Non-solicitation clause', default: false },
  { id: 'ip_assignment', label: 'IP assignment to client', default: false },
  { id: 'auto_renewal', label: 'Auto-renewal clause', default: false },
];

const STEP_LABELS = { 1: 'Contract Type', 2: 'Parties & Scope', 3: 'Key Terms', 4: 'Review & Generate' };

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-white/5">
      {[1, 2, 3, 4].map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1">
          <div className={`flex items-center gap-1.5 ${step <= current ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              step < current ? 'bg-covered text-white' :
              step === current ? 'bg-primary text-white scale-110' :
              'bg-white/10 text-text-secondary'
            }`}>
              {step < current ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === current ? 'text-primary' : 'text-text-secondary'}`}>
              {STEP_LABELS[step]}
            </span>
          </div>
          {i < 3 && <div className={`flex-1 h-px mx-1 ${step < current ? 'bg-covered/40' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function GenerateContractModal({ businessId, onClose, onSaved, prefill = {} }) {
  const [step, setStep] = useState(1);
  const [contractType, setContractType] = useState('service_agreement');
  const [clientName, setClientName] = useState(prefill.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(prefill.clientEmail ?? '');
  const [clientCompany, setClientCompany] = useState('');
  const [scopeDescription, setScopeDescription] = useState(prefill.scopeDescription ?? '');
  const [projectLocation, setProjectLocation] = useState('');
  const [duration, setDuration] = useState('one_time');
  const [paymentAmount, setPaymentAmount] = useState(prefill.paymentAmount ? String(prefill.paymentAmount) : '');
  const [paymentSchedule, setPaymentSchedule] = useState('net15');
  const [terminationNotice, setTerminationNotice] = useState('30');
  const [liabilityCap, setLiabilityCap] = useState('1x');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(true);
  const [selectedClauses, setSelectedClauses] = useState(
    new Set(OPTIONAL_CLAUSES.filter((c) => c.default).map((c) => c.id))
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);

  const toggleClause = (id) => {
    setSelectedClauses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canAdvance = () => {
    if (step === 2) return clientName.trim().length > 0;
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const typeLabel = CONTRACT_TYPES.find((t) => t.value === contractType)?.label ?? contractType;
    const paymentLabel = PAYMENT_SCHEDULES.find((p) => p.value === paymentSchedule)?.label ?? paymentSchedule;
    const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration;

    const customFields = {
      'Scope of work': scopeDescription || 'As discussed between parties',
      'Payment schedule': paymentLabel,
      'Project duration': durationLabel,
      'Termination notice': `${terminationNotice} days written notice`,
      'Liability cap': liabilityCap === '1x' ? 'Limited to contract value' : liabilityCap === '2x' ? 'Limited to 2× contract value' : 'No cap specified',
      'Late payment fee': lateFeeEnabled ? '1.5% per month on overdue balances' : 'None',
      'Included clauses': Array.from(selectedClauses).join(', '),
    };
    if (paymentAmount) customFields['Contract value'] = `$${paymentAmount}`;
    if (clientCompany) customFields['Client company'] = clientCompany;
    if (projectLocation) customFields['Project location'] = projectLocation;

    try {
      const data = await api.generateContract({
        businessId,
        contractType,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        customFields,
      });
      setHtml(data.html);
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!html) return;
    setSaving(true);
    setError(null);
    const typeLabel = CONTRACT_TYPES.find((t) => t.value === contractType)?.label ?? contractType;
    try {
      const created = await api.createContract({
        fileName: `${contractType}-${clientName.replace(/\s+/g, '-').toLowerCase()}.html`,
        fileUrl: '',
        fileType: 'generated',
        contractType,
        counterpartyName: clientName.trim(),
        autoRenews: selectedClauses.has('auto_renewal'),
        healthScore: 100,
        status: 'draft',
        analysis: { summary: `Generated ${typeLabel} for ${clientName}${clientCompany ? ` (${clientCompany})` : ''}` },
        obligations: [],
      });
      onSaved?.(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save to vault');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractType}-${clientName.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win || !html) return;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="font-semibold text-text-primary">Generate a contract</p>
            <p className="text-xs text-text-secondary mt-0.5">AI-drafted · Ready to sign</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!html && !generating && <StepIndicator current={step} />}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Generating */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Drafting your contract...</p>
            </div>
          )}

          {/* Preview */}
          {!generating && html && (
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-covered rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-text-primary">Contract ready — review before saving</p>
              </div>
              <div
                className="border border-white/10 rounded-xl p-5 text-sm overflow-y-auto max-h-80 bg-white text-slate-900 shadow-inner"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}

          {/* Step 1: Contract Type */}
          {!generating && !html && step === 1 && (
            <div className="px-6 py-5">
              <p className="text-sm font-medium text-text-primary mb-3">What kind of contract do you need?</p>
              <div className="grid grid-cols-2 gap-2">
                {CONTRACT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setContractType(ct.value)}
                    className={`text-left p-3 rounded-xl border-2 transition-all duration-150 ${
                      contractType === ct.value ? 'border-primary bg-primary/10' : ct.color
                    }`}
                  >
                    <p className={`text-sm font-semibold ${contractType === ct.value ? 'text-primary' : 'text-text-primary'}`}>{ct.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-tight">{ct.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Parties & Scope */}
          {!generating && !html && step === 2 && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                    {contractType === 'independent_contractor' || contractType === 'subcontractor_agreement' ? 'Contractor name' : 'Client name'} <span className="text-gap">*</span>
                  </label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Jane Smith" className="control-input w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Email (optional)</label>
                  <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" type="email" className="control-input w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Company (optional)</label>
                  <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Acme Corp" className="control-input w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Location (optional)</label>
                  <input value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} placeholder="Miami, FL" className="control-input w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Scope of work</label>
                <textarea
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  placeholder="Describe exactly what you're providing. The more specific, the stronger the contract."
                  className="control-input w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary resize-none leading-relaxed"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d.value} onClick={() => setDuration(d.value)} className={`py-2 px-3 text-xs rounded-lg border text-center transition-all ${duration === d.value ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-white/10 text-text-secondary hover:border-white/20'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Key Terms */}
          {!generating && !html && step === 3 && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Payment</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Contract value (optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">$</span>
                      <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className="control-input w-full h-9 pl-7 pr-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Payment schedule</label>
                    <select value={paymentSchedule} onChange={(e) => setPaymentSchedule(e.target.value)} className="control-input w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-text-primary">
                      {PAYMENT_SCHEDULES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => setLateFeeEnabled(!lateFeeEnabled)} className="flex items-center gap-2 mt-2 cursor-pointer">
                  <div className={`w-8 rounded-full relative transition-colors flex-shrink-0 ${lateFeeEnabled ? 'bg-primary' : 'bg-white/10'}`} style={{ height: '18px' }}>
                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${lateFeeEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-text-secondary">Include 1.5%/month late payment fee</span>
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Termination notice</label>
                <div className="flex gap-2">
                  {NOTICE_OPTIONS.map((n) => (
                    <button key={n.value} onClick={() => setTerminationNotice(n.value)} className={`flex-1 py-2 text-xs rounded-lg border transition-all ${terminationNotice === n.value ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-white/10 text-text-secondary hover:border-white/20'}`}>{n.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Liability cap</label>
                <div className="flex gap-2">
                  {['1x', '2x', 'none'].map((cap) => (
                    <button key={cap} onClick={() => setLiabilityCap(cap)} className={`flex-1 py-2 text-xs rounded-lg border transition-all ${liabilityCap === cap ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-white/10 text-text-secondary hover:border-white/20'}`}>
                      {cap === '1x' ? '1× contract value' : cap === '2x' ? '2× contract value' : 'No cap'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-1">1× contract value is the industry standard.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Include these clauses</label>
                <div className="space-y-2">
                  {OPTIONAL_CLAUSES.map((clause) => (
                    <label key={clause.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <div onClick={() => toggleClause(clause.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedClauses.has(clause.id) ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                        {selectedClauses.has(clause.id) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-text-primary">{clause.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {!generating && !html && step === 4 && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-text-secondary">Review your settings, then generate.</p>
              <div className="surface-panel rounded-xl border border-white/5 divide-y divide-white/5">
                {[
                  { label: 'Contract type', value: CONTRACT_TYPES.find((t) => t.value === contractType)?.label },
                  { label: 'For', value: clientCompany ? `${clientName} (${clientCompany})` : clientName },
                  { label: 'Duration', value: DURATION_OPTIONS.find((d) => d.value === duration)?.label },
                  { label: 'Payment', value: PAYMENT_SCHEDULES.find((p) => p.value === paymentSchedule)?.label },
                  { label: 'Contract value', value: paymentAmount ? `$${parseFloat(paymentAmount).toLocaleString()}` : 'Not specified' },
                  { label: 'Termination notice', value: `${terminationNotice} days` },
                  { label: 'Liability cap', value: liabilityCap === '1x' ? '1× contract value' : liabilityCap === '2x' ? '2× contract value' : 'None' },
                  { label: 'Clauses included', value: `${selectedClauses.size} of ${OPTIONAL_CLAUSES.length}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-text-secondary">{row.label}</span>
                    <span className="text-sm font-medium text-text-primary">{row.value}</span>
                  </div>
                ))}
              </div>
              {scopeDescription && (
                <div className="surface-panel rounded-xl p-3 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">Scope of work</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{scopeDescription}</p>
                </div>
              )}
              {error && <p className="p-3 bg-gap/10 border border-gap/20 rounded-xl text-sm text-gap">{error}</p>}
            </div>
          )}

          {error && !generating && html && (
            <p className="mx-6 mb-4 p-3 bg-gap/10 border border-gap/20 rounded-xl text-sm text-gap">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/5">
          {html && !generating ? (
            <>
              <button onClick={() => { setHtml(null); setStep(4); }} className="text-sm text-text-secondary hover:text-text-primary">← Edit</button>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
                <button onClick={handleSaveToVault} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-primary rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save to Vault
                </button>
              </div>
            </>
          ) : !generating ? (
            <>
              <button onClick={() => step > 1 ? setStep((s) => s - 1) : onClose()} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                {step === 1 ? 'Cancel' : '← Back'}
              </button>
              {step < 4 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-40">
                  Continue →
                </button>
              ) : (
                <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/80 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.13A3.5 3.5 0 0112 18.5a3.5 3.5 0 01-3.093-1.47l-.347-.13z" /></svg>
                  Generate Contract
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
