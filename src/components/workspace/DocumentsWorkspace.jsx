/**
 * DocumentsWorkspace ΓÇö Contracts, Quotes, Receipts, Compliance in one place.
 * Each tab loads its own data lazily on first activation ΓÇö no upfront waterfall.
 */
import { useContext, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature, Send, Camera, BadgeCheck,
  Upload, Sparkles, Loader2, ChevronDown, AlertTriangle, Lock,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';
import GenerateContractModal from './GenerateContractModal';

// ΓöÇΓöÇΓöÇ Tab config ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const TABS = [
  {
    id: 'contracts',
    label: 'Contracts',
    icon: FileSignature,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    hoverBg: 'hover:bg-blue-500/8 hover:border-blue-500/20 hover:text-blue-300',
    dotColor: 'bg-blue-400',
    description: 'Agreements & legal docs',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: Send,
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
    hoverBg: 'hover:bg-violet-500/8 hover:border-violet-500/20 hover:text-violet-300',
    dotColor: 'bg-violet-400',
    description: 'Client pricing & pipeline',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: Camera,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    hoverBg: 'hover:bg-emerald-500/8 hover:border-emerald-500/20 hover:text-emerald-300',
    dotColor: 'bg-emerald-400',
    description: 'Expenses & deductions',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: BadgeCheck,
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    hoverBg: 'hover:bg-amber-500/8 hover:border-amber-500/20 hover:text-amber-300',
    dotColor: 'bg-amber-400',
    description: 'Licenses & obligations',
  },
];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
];

// ΓöÇΓöÇΓöÇ Main component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function DocumentsWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('contracts');

  // Per-tab data ΓÇö loaded lazily on first visit
  const [contracts, setContracts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [compliance, setCompliance] = useState([]);

  // Track which tabs have been loaded
  const loaded = useRef({ contracts: false, quotes: false, receipts: false, compliance: false });
  const [tabLoading, setTabLoading] = useState(false);

  const loaders = {
    contracts: () => api.listContracts().then(r => setContracts(Array.isArray(r) ? r : [])),
    quotes: () => api.listQuotes().then(r => setQuotes(Array.isArray(r) ? r : [])),
    receipts: () => api.listReceipts().then(r => setReceipts(Array.isArray(r) ? r : [])),
    compliance: () => api.listCompliance().then(r => setCompliance(Array.isArray(r) ? r : [])),
  };

  // Load data for the active tab on first visit
  useEffect(() => {
    if (!businessInfo?.id || loaded.current[activeTab]) return;
    loaded.current[activeTab] = true;
    setTabLoading(true);
    loaders[activeTab]().catch(() => {}).finally(() => setTabLoading(false));
  }, [activeTab, businessInfo?.id]);

  // Pipeline: each tab unlocks after the previous has data
  const counts = {
    contracts: contracts.length,
    quotes: quotes.length,
    receipts: receipts.length,
    compliance: compliance.length,
  };
  const unlocked = {
    contracts: true,
    quotes: counts.contracts > 0,
    receipts: counts.quotes > 0,
    compliance: counts.receipts > 0,
  };
  const done = {
    contracts: counts.contracts > 0,
    quotes: counts.quotes > 0,
    receipts: counts.receipts > 0,
    compliance: compliance.some(c => c.status !== 'not_started'),
  };

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <section className="space-y-5">
      {/* Tab bar */}
      <div className="surface-panel rounded-[24px] p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isUnlocked = unlocked[tab.id];
            const isDone = done[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => isUnlocked && setActiveTab(tab.id)}
                disabled={!isUnlocked}
                className={`
                  relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3
                  text-center transition-all duration-200 select-none
                  ${isActive
                    ? `${tab.activeBg} shadow-sm`
                    : isUnlocked
                      ? `border-white/5 text-text-secondary ${tab.hoverBg} cursor-pointer`
                      : 'border-white/[0.03] text-text-secondary/25 cursor-not-allowed'
                  }
                `}
              >
                {/* Done indicator */}
                {isDone && !isActive && (
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
                )}

                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-white/10' : isUnlocked ? 'bg-white/[0.04]' : 'bg-white/[0.02]'
                }`}>
                  {!isUnlocked
                    ? <Lock className="h-3.5 w-3.5" />
                    : <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                  }
                </div>

                <span className={`text-xs font-semibold tracking-wide ${isActive ? '' : ''}`}>
                  {tab.label}
                </span>
                <span className={`text-[10px] leading-tight hidden sm:block ${isActive ? 'opacity-70' : 'opacity-40'}`}>
                  {tab.description}
                </span>

                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full ${tab.dotColor}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          {tabLoading ? (
            <div className="surface-panel rounded-[24px] p-10 flex flex-col items-center gap-3">
              <Loader2 className={`h-5 w-5 animate-spin ${activeTabConfig?.color}`} />
              <p className="text-xs text-text-secondary">Loading {activeTabConfig?.label.toLowerCase()}...</p>
            </div>
          ) : !unlocked[activeTab] ? (
            <div className="surface-panel rounded-[24px] p-10 text-center">
              <Lock className="h-7 w-7 text-text-secondary/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">Complete the previous step first</p>
              <p className="text-xs text-text-secondary mt-1">Work through the pipeline in order to unlock this section.</p>
            </div>
          ) : activeTab === 'contracts' ? (
            <ContractsSection contracts={contracts} setContracts={setContracts} businessInfo={businessInfo} />
          ) : activeTab === 'quotes' ? (
            <QuotesSection quotes={quotes} setQuotes={setQuotes} businessInfo={businessInfo} />
          ) : activeTab === 'receipts' ? (
            <ReceiptsSection receipts={receipts} setReceipts={setReceipts} businessInfo={businessInfo} />
          ) : (
            <ComplianceSection items={compliance} setItems={setCompliance} businessInfo={businessInfo} />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ΓöÇΓöÇΓöÇ Contracts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ContractsSection({ contracts, setContracts, businessInfo }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ contractType: 'service', counterpartyName: '', effectiveDate: '', expirationDate: '', totalValue: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Attach a file first.'); return; }
    setSaving(true); setError('');
    try {
      const uploaded = await api.uploadWorkspaceFile('contracts', file);
      const created = await api.createContract({
        uploadedFileId: uploaded.id, fileName: uploaded.file_name, fileUrl: uploaded.blob_url,
        fileType: file.type || 'application/pdf', contractType: form.contractType,
        counterpartyName: form.counterpartyName, effectiveDate: form.effectiveDate || null,
        expirationDate: form.expirationDate || null, totalValue: form.totalValue ? Number(form.totalValue) : null,
      });
      setContracts(cur => [created, ...cur]);
      setFile(null); setShowUpload(false);
    } catch (e) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleAnalyze = async (contract) => {
    setAnalyzing(true); setSelectedContract(contract);
    try {
      const text = `Contract: ${contract.file_name}\nType: ${contract.contract_type}\nCounterparty: ${contract.counterparty_name}`;
      const analysis = await api.analyzeContract({ contractText: text, businessId: businessInfo.id, contractId: contract.id });
      setContracts(cur => cur.map(c => c.id === contract.id ? { ...c, analysis: JSON.stringify(analysis), health_score: analysis.healthScore } : c));
      setSelectedContract({ ...contract, _analysis: analysis });
    } catch (e) { setError(e.message || 'Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const parsedAnalysis = selectedContract?._analysis || tryParseJSON(selectedContract?.analysis);
  const totalValue = contracts.reduce((s, c) => s + Number(c.total_value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-[24px] p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm font-semibold text-text-primary">Contracts</p>
            <p className="text-xs text-text-secondary mt-0.5">{contracts.length} tracked ┬╖ {formatCurrency(totalValue)} total value</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-400 active:scale-95 transition-all duration-150 shadow-sm shadow-blue-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 active:scale-95 ${
                showUpload
                  ? 'bg-white/10 border-white/20 text-text-primary'
                  : 'border-white/10 text-text-secondary hover:bg-white/5 hover:border-white/20 hover:text-text-primary'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showUpload && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleUpload}
              className="mb-5 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 space-y-3">
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="control-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.counterpartyName} onChange={e => setForm(c => ({ ...c, counterpartyName: e.target.value }))} placeholder="Counterparty name" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                  <select value={form.contractType} onChange={e => setForm(c => ({ ...c, contractType: e.target.value }))} className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary">
                    <option value="service">Service agreement</option>
                    <option value="vendor">Vendor agreement</option>
                    <option value="lease">Lease</option>
                    <option value="nda">NDA</option>
                  </select>
                  <input value={form.effectiveDate} onChange={e => setForm(c => ({ ...c, effectiveDate: e.target.value }))} type="date" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                  <input value={form.expirationDate} onChange={e => setForm(c => ({ ...c, expirationDate: e.target.value }))} type="date" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                </div>
                {error && <p className="text-xs text-gap">{error}</p>}
                <RippleButton type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : 'Save contract'}</RippleButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {contracts.length === 0 ? (
          <div className="py-8 text-center">
            <FileSignature className="h-8 w-8 text-blue-400/30 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No contracts yet.</p>
            <p className="text-xs text-text-secondary/60 mt-1">Generate an AI-drafted contract or upload an existing one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contracts.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { const a = tryParseJSON(c.analysis); a?.clauses ? setSelectedContract({ ...c, _analysis: a }) : handleAnalyze(c); }}
                className="w-full text-left surface-panel rounded-2xl p-3.5 hover:border-blue-500/25 hover:bg-blue-500/5 active:scale-[0.99] transition-all duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.counterparty_name || c.file_name}</p>
                    <p className="text-xs text-text-secondary mt-0.5 capitalize">{c.contract_type?.replace(/_/g, ' ')} ┬╖ {c.status}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0">
                    {c.health_score && (
                      <span className={`px-2 py-0.5 rounded-full font-medium ${Number(c.health_score) >= 70 ? 'bg-covered/10 text-covered' : 'bg-gap/10 text-gap'}`}>
                        {c.health_score}%
                      </span>
                    )}
                    {analyzing && selectedContract?.id === c.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      : <span className="text-blue-400 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Analyze</span>
                    }
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedContract && parsedAnalysis && (
        <ContractAnalysisPanel contract={selectedContract} analysis={parsedAnalysis} onClose={() => setSelectedContract(null)} />
      )}

      {showGenerate && businessInfo?.id && (
        <GenerateContractModal businessId={businessInfo.id} onClose={() => setShowGenerate(false)} onSaved={created => setContracts(cur => [created, ...cur])} />
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Quotes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function QuotesSection({ quotes, setQuotes, businessInfo }) {
  const [form, setForm] = useState({ clientName: '', clientEmail: '', services: '', subtotal: '', taxRate: '0.0825', scheduledDate: '' });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const subtotal = Number(form.subtotal || 0);
    const taxRate = Number(form.taxRate || 0);
    const taxAmount = subtotal * taxRate;
    try {
      const created = await api.createQuote({ clientName: form.clientName, clientEmail: form.clientEmail, services: form.services, subtotal, taxRate, taxAmount, total: subtotal + taxAmount, scheduledDate: form.scheduledDate || null, status: 'draft' });
      setQuotes(cur => [created, ...cur]);
      setForm({ clientName: '', clientEmail: '', services: '', subtotal: '', taxRate: '0.0825', scheduledDate: '' });
      setShowForm(false);
    } catch (e) { setError(e.message || 'Failed to create quote'); }
    finally { setSaving(false); }
  };

  const handleAIGenerate = async () => {
    if (!businessInfo?.id || !form.clientName || !form.services) { setError('Enter client name and services first.'); return; }
    setGenerating(true); setError('');
    try {
      const result = await api.generateQuote({ businessId: businessInfo.id, clientName: form.clientName, serviceDescription: form.services });
      if (result) {
        const services = (result.services || []).map(s => s.label || s.description || '').join('\n');
        setForm(cur => ({ ...cur, services: services || cur.services, subtotal: String(result.subtotal || cur.subtotal), taxRate: String(result.taxRate || cur.taxRate) }));
      }
    } catch (e) { setError(e.message || 'AI generation failed'); }
    finally { setGenerating(false); }
  };

  const pipelineValue = quotes.reduce((s, q) => s + Number(q.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-[24px] p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm font-semibold text-text-primary">Quotes</p>
            <p className="text-xs text-text-secondary mt-0.5">{quotes.length} total ┬╖ {formatCurrency(pipelineValue)} pipeline</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 active:scale-95 ${
              showForm
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'border-white/10 text-text-secondary hover:bg-violet-500/8 hover:border-violet-500/20 hover:text-violet-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> New Quote
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="mb-5 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.clientName} onChange={e => setForm(c => ({ ...c, clientName: e.target.value }))} placeholder="Client name" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                  <input value={form.clientEmail} onChange={e => setForm(c => ({ ...c, clientEmail: e.target.value }))} placeholder="Client email" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                </div>
                <textarea value={form.services} onChange={e => setForm(c => ({ ...c, services: e.target.value }))} placeholder="One service per line" rows={3} className="control-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                <div className="grid grid-cols-3 gap-3">
                  <input value={form.subtotal} onChange={e => setForm(c => ({ ...c, subtotal: e.target.value }))} placeholder="Subtotal" type="number" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                  <input value={form.taxRate} onChange={e => setForm(c => ({ ...c, taxRate: e.target.value }))} placeholder="Tax rate" type="number" step="0.0001" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                  <input value={form.scheduledDate} onChange={e => setForm(c => ({ ...c, scheduledDate: e.target.value }))} type="date" className="control-input rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-text-primary" />
                </div>
                {error && <p className="text-xs text-gap">{error}</p>}
                <div className="flex gap-2">
                  <RippleButton type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : 'Save quote'}</RippleButton>
                  <button type="button" onClick={handleAIGenerate} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-300 border border-violet-500/20 rounded-lg hover:bg-violet-500/10 transition-colors disabled:opacity-50">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    AI Price
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {quotes.length === 0 ? (
          <div className="py-8 text-center">
            <Send className="h-8 w-8 text-violet-400/30 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No quotes yet.</p>
            <p className="text-xs text-text-secondary/60 mt-1">Create a quote to start tracking your revenue pipeline.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <div key={q.id} className="surface-panel rounded-2xl p-3.5 flex items-center justify-between hover:border-violet-500/20 transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{q.client_name || 'Untitled'}</p>
                  <p className="text-xs text-text-secondary mt-0.5 capitalize">{q.status} ┬╖ {q.scheduled_date || 'Unscheduled'}</p>
                </div>
                <span className="text-sm font-medium text-text-secondary">{formatCurrency(Number(q.total || 0))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Receipts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ReceiptsSection({ receipts, setReceipts, businessInfo }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  const deductibleTotal = receipts.reduce((s, r) => s + Number(r.deductible_amount || 0), 0);

  const handleScan = async () => {
    if (!file || !businessInfo?.id) return;
    setScanning(true); setError(''); setScanResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.analyzeReceipt({ fileBase64: base64, fileMimeType: file.type, businessId: businessInfo.id });
      setScanResult(result);
    } catch (e) { setError(e.message || 'Scan failed'); }
    finally { setScanning(false); }
  };

  const handleSave = async () => {
    if (!scanResult || !businessInfo?.id) return;
    setSaving(true); setError('');
    try {
      let uploaded = null;
      if (file) uploaded = await api.uploadWorkspaceFile('receipts', file);
      const created = await api.createReceipt({
        uploadedFileId: uploaded?.id || null, imageUrl: uploaded?.blob_url || '',
        vendor: scanResult.vendor || '', amount: Number(scanResult.amount || 0),
        date: scanResult.date || new Date().toISOString().slice(0, 10),
        category: scanResult.category || 'other', taxClassification: scanResult.taxClassification || 'expense',
        businessPercentage: Number(scanResult.businessPercentage || 100),
        deductibleAmount: Number(scanResult.deductibleAmount || scanResult.amount || 0),
        taxNotes: scanResult.taxNotes || '', lineItems: scanResult.lineItems || [],
        associatedMileage: scanResult.associatedMileage || null,
        needsMoreInfo: Boolean(scanResult.needsMoreInfo), pendingQuestion: scanResult.pendingQuestion || null,
      });
      setReceipts(cur => [created, ...cur]);
      setFile(null); setScanResult(null);
    } catch (e) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-[24px] p-5">
        <div className="mb-5">
          <p className="text-sm font-semibold text-text-primary">Receipts</p>
          <p className="text-xs text-text-secondary mt-0.5">{receipts.length} saved ┬╖ {formatCurrency(deductibleTotal)} deductible</p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:bg-emerald-500/10 transition-colors mb-2">
            <Camera className="h-5 w-5 text-text-secondary group-hover:text-emerald-400 transition-colors" />
          </div>
          <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
            {file ? file.name : 'Click or drag to upload receipt'}
          </span>
          <span className="mt-1 text-xs text-text-secondary/50">JPEG, PNG, WEBP, or PDF</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { setFile(e.target.files?.[0] || null); setScanResult(null); }} className="hidden" />
        </label>

        <AnimatePresence>
          {file && !scanResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex gap-2">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-400 active:scale-95 transition-all duration-150 disabled:opacity-50 shadow-sm shadow-emerald-500/20"
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {scanning ? 'Analyzing...' : 'AI Scan Receipt'}
              </button>
              <button onClick={() => setFile(null)} className="px-3 py-2 text-xs text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scanResult && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-xs font-semibold text-emerald-400">AI scan complete</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Vendor', scanResult.vendor || 'Unknown'],
                  ['Amount', formatCurrency(Number(scanResult.amount || 0))],
                  ['Category', scanResult.category],
                  ['Deductible', `${formatCurrency(Number(scanResult.deductibleAmount || 0))} (${scanResult.businessPercentage}%)`],
                ].map(([label, val]) => (
                  <div key={label} className="surface-panel rounded-xl p-2.5">
                    <p className="text-xs text-text-secondary">{label}</p>
                    <p className="text-sm font-medium text-text-primary mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              {scanResult.taxNotes && <p className="text-xs text-text-secondary">{scanResult.taxNotes}</p>}
              {scanResult.needsMoreInfo && <p className="text-xs text-warning">{scanResult.pendingQuestion}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-400 active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save receipt'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-3 text-xs text-gap">{error}</p>}

        {receipts.length === 0 && !file && (
          <div className="mt-4 text-center">
            <p className="text-xs text-text-secondary/50">No receipts yet. Upload your first one above.</p>
          </div>
        )}
      </div>

      {receipts.length > 0 && (
        <div className="surface-panel rounded-[24px] p-5 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Recent receipts</p>
          {receipts.map(r => (
            <div key={r.id} className="surface-panel rounded-2xl p-3.5 flex items-center justify-between hover:border-emerald-500/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">{r.vendor || 'Unknown vendor'}</p>
                <p className="text-xs text-text-secondary mt-0.5 capitalize">{r.category?.replace(/_/g, ' ')} ┬╖ {r.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">{formatCurrency(Number(r.amount || 0))}</p>
                {r.deductible_amount > 0 && <p className="text-xs text-emerald-400 mt-0.5">-{formatCurrency(Number(r.deductible_amount))}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Compliance ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ComplianceSection({ items, setItems, businessInfo }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const completedCount = items.filter(i => i.status === 'complete').length;
  const requiredCount = items.filter(i => i.is_required).length;

  const handleGenerate = async () => {
    if (!businessInfo?.id) return;
    setGenerating(true); setError('');
    try {
      await api.generateCompliance({ businessId: businessInfo.id });
      const rows = await api.listCompliance();
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) { setError(e.message || 'Failed to generate'); }
    finally { setGenerating(false); }
  };

  const updateStatus = async (id, status) => {
    setItems(cur => cur.map(i => i.id === id ? { ...i, status } : i));
    try {
      const updated = await api.updateCompliance(id, { status });
      setItems(cur => cur.map(i => i.id === id ? updated : i));
    } catch (e) { setError(e.message || 'Failed to update'); }
  };

  return (
    <div className="space-y-4">
      <div className="surface-panel rounded-[24px] p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm font-semibold text-text-primary">Compliance obligations</p>
            <p className="text-xs text-text-secondary mt-0.5">{completedCount} of {items.length} complete ┬╖ {requiredCount} required</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-400 active:scale-95 transition-all duration-150 disabled:opacity-50 shadow-sm shadow-amber-500/20"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating...' : 'AI Generate'}
          </button>
        </div>

        {error && <p className="text-xs text-gap mb-3">{error}</p>}

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <BadgeCheck className="h-8 w-8 text-amber-400/30 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No compliance items yet.</p>
            <p className="text-xs text-text-secondary/60 mt-1">Click AI Generate to build your checklist from your business profile.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className={`surface-panel rounded-2xl p-3.5 transition-colors ${
                  item.is_required && item.status === 'not_started'
                    ? 'border-amber-500/20 hover:border-amber-500/30'
                    : item.status === 'complete'
                      ? 'border-covered/15 hover:border-covered/25'
                      : 'hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_required && item.status !== 'complete' && (
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md">Required</span>
                      )}
                      {item.status === 'complete' && (
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-covered bg-covered/10 px-1.5 py-0.5 rounded-md">Done</span>
                      )}
                      <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.description}</p>
                    <p className="text-[10px] text-text-secondary/50 mt-1.5 uppercase tracking-wider">{item.jurisdiction_name} ┬╖ {item.category}</p>
                    {item.application_url && (
                      <a href={item.application_url} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:text-amber-300 hover:underline mt-1 inline-block transition-colors">
                        Open resource ΓåÆ
                      </a>
                    )}
                  </div>
                  <select
                    value={item.status}
                    onChange={e => void updateStatus(item.id, e.target.value)}
                    className="control-input flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-text-primary hover:border-white/20 transition-colors cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Contract Analysis Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ContractAnalysisPanel({ contract, analysis, onClose }) {
  const [expandedClause, setExpandedClause] = useState(null);
  return (
    <div className="glass-card rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">{contract.counterparty_name || contract.file_name}</p>
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{analysis.summary}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {analysis.healthScore && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${Number(analysis.healthScore) >= 70 ? 'bg-covered/10 text-covered' : 'bg-gap/10 text-gap'}`}>
              {analysis.healthScore}
            </div>
          )}
          <button type="button" onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
      {analysis.clauses?.length > 0 && (
        <div className="space-y-1.5">
          {analysis.clauses.map((clause, i) => (
            <div key={i} className="surface-panel overflow-hidden rounded-xl">
              <button type="button" onClick={() => setExpandedClause(expandedClause === i ? null : i)} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${clause.risk === 'high' ? 'bg-gap' : clause.risk === 'medium' ? 'bg-warning' : 'bg-covered'}`} />
                  <span className="text-sm text-text-primary">{clause.title}</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-text-secondary transition-transform flex-shrink-0 ${expandedClause === i ? 'rotate-180' : ''}`} />
              </button>
              {expandedClause === i && (
                <div className="border-t border-white/5 px-3 pb-3 pt-2">
                  <p className="text-xs text-text-secondary leading-relaxed">{clause.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {analysis.missingProtections?.length > 0 && (
        <div className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning mb-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Missing Protections
          </p>
          {analysis.missingProtections.map((p, i) => <p key={i} className="text-xs text-warning/80 leading-relaxed">ΓÇó {p}</p>)}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function tryParseJSON(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
