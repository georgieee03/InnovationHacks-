import { useContext, useEffect, useState } from 'react';
import { Camera, Receipt, FolderOpen, Sparkles, Loader2, Upload } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

const CATEGORIES = [
  'operations', 'inventory', 'marketing', 'equipment', 'supplies',
  'vehicle_fuel', 'vehicle_maintenance', 'insurance', 'rent', 'utilities',
  'professional_services', 'meals_entertainment', 'office_supplies',
  'software', 'training', 'other',
];

export default function ReceiptsWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [receipts, setReceipts] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let active = true;
    if (!businessInfo?.id) { setReceipts([]); setLoading(false); return; }
    setLoading(true);
    api.listReceipts()
      .then((rows) => { if (active) { setReceipts(Array.isArray(rows) ? rows : []); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Failed to load receipts'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessInfo?.id]);

  const deductibleTotal = receipts.reduce((sum, r) => sum + Number(r.deductible_amount || 0), 0);

  const handleAIScan = async () => {
    if (!file || !businessInfo?.id) return;
    setScanning(true);
    setError('');
    setScanResult(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await api.analyzeReceipt({
        fileBase64: base64,
        fileMimeType: file.type,
        businessId: businessInfo.id,
      });
      setScanResult(result);
    } catch (e) {
      setError(e.message || 'AI receipt scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveScanned = async () => {
    if (!scanResult || !businessInfo?.id) return;
    setSaving(true);
    setError('');

    try {
      let uploadedFile = null;
      if (file) {
        uploadedFile = await api.uploadWorkspaceFile('receipts', file);
      }

      const created = await api.createReceipt({
        uploadedFileId: uploadedFile?.id || null,
        imageUrl: uploadedFile?.blob_url || '',
        vendor: scanResult.vendor || '',
        amount: Number(scanResult.amount || 0),
        date: scanResult.date || new Date().toISOString().slice(0, 10),
        category: scanResult.category || 'other',
        taxClassification: scanResult.taxClassification || 'expense',
        businessPercentage: Number(scanResult.businessPercentage || 100),
        deductibleAmount: Number(scanResult.deductibleAmount || scanResult.amount || 0),
        taxNotes: scanResult.taxNotes || '',
        lineItems: scanResult.lineItems || [],
        associatedMileage: scanResult.associatedMileage || null,
        needsMoreInfo: Boolean(scanResult.needsMoreInfo),
        pendingQuestion: scanResult.pendingQuestion || null,
      });

      setReceipts((cur) => [created, ...cur]);
      setFile(null);
      setScanResult(null);
      setShowUpload(false);
    } catch (e) {
      setError(e.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!file) { setError('Attach a receipt file first.'); return; }
    setSaving(true);
    setError('');
    try {
      const uploadedFile = await api.uploadWorkspaceFile('receipts', file);
      const created = await api.createReceipt({
        uploadedFileId: uploadedFile.id,
        imageUrl: uploadedFile.blob_url,
        vendor: 'Manual upload',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        category: 'other',
      });
      setReceipts((cur) => [created, ...cur]);
      setFile(null);
      setShowUpload(false);
    } catch (e) {
      setError(e.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="surface-panel-strong rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Receipts</p>
            <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">
              Capture and analyze operating spend
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
              Upload receipts and let AI categorize them, flag tax deductions, and track spending automatically.
            </p>
          </div>
          <RippleButton variant="primary" size="md" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4" />
            Upload Receipt
          </RippleButton>
        </div>

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
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">AI powered</p>
            <p className="mt-2 text-sm text-text-primary">Groq vision analyzes images, categorizes spend, and flags deductions.</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="glass-card rounded-[30px] p-6">
          <div className="flex items-start gap-3">
            <div className="surface-chip flex h-11 w-11 items-center justify-center rounded-2xl">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Upload a receipt</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Drop an image or PDF. AI will extract vendor, amount, category, and tax info.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-primary/30 hover:bg-primary/5">
              <Upload className="mb-2 h-8 w-8 text-text-secondary" />
              <span className="text-sm text-text-secondary">{file ? file.name : 'Click or drag to upload'}</span>
              <span className="mt-1 text-xs text-text-secondary/60">JPEG, PNG, WEBP, or PDF</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setScanResult(null); }}
                className="hidden"
              />
            </label>
          </div>

          {file && !scanResult && (
            <div className="mt-4 flex flex-wrap gap-3">
              <RippleButton variant="primary" size="md" onClick={handleAIScan} disabled={scanning}>
                {scanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> AI Scan Receipt</>}
              </RippleButton>
              <RippleButton variant="secondary" size="md" onClick={handleManualSave} disabled={saving}>
                Save without AI scan
              </RippleButton>
            </div>
          )}

          {/* AI Scan Results */}
          {scanResult && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-primary">AI Analysis Complete</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-panel rounded-2xl p-3">
                  <p className="text-xs text-text-secondary">Vendor</p>
                  <p className="mt-1 text-sm text-text-primary">{scanResult.vendor || 'Unknown'}</p>
                </div>
                <div className="surface-panel rounded-2xl p-3">
                  <p className="text-xs text-text-secondary">Amount</p>
                  <p className="mt-1 text-sm text-text-primary">{formatCurrency(Number(scanResult.amount || 0))}</p>
                </div>
                <div className="surface-panel rounded-2xl p-3">
                  <p className="text-xs text-text-secondary">Category</p>
                  <p className="mt-1 text-sm text-text-primary">{scanResult.category}</p>
                </div>
                <div className="surface-panel rounded-2xl p-3">
                  <p className="text-xs text-text-secondary">Deductible</p>
                  <p className="mt-1 text-sm text-covered">{formatCurrency(Number(scanResult.deductibleAmount || 0))} ({scanResult.businessPercentage}%)</p>
                </div>
              </div>
              {scanResult.taxNotes && (
                <div className="surface-panel rounded-2xl p-3">
                  <p className="text-xs text-text-secondary">Tax Notes</p>
                  <p className="mt-1 text-sm text-text-primary">{scanResult.taxNotes}</p>
                </div>
              )}
              {scanResult.needsMoreInfo && scanResult.pendingQuestion && (
                <div className="rounded-2xl border border-warning/20 bg-warning/5 p-3">
                  <p className="text-sm text-warning">{scanResult.pendingQuestion}</p>
                </div>
              )}
              <RippleButton variant="primary" size="md" onClick={handleSaveScanned} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save this receipt'}
              </RippleButton>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-gap">{error}</p>}
        </div>
      )}

      {/* Receipt list */}
      <div className="surface-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Recent receipts</p>
            <p className="mt-1 text-sm text-text-secondary">Every upload is attached to this business profile.</p>
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
                    {receipt.tax_notes && <p className="mt-1 text-xs text-text-secondary/70">{receipt.tax_notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{formatCurrency(Number(receipt.amount || 0))}</span>
                    {receipt.deductible_amount > 0 && (
                      <span className="text-covered">-{formatCurrency(Number(receipt.deductible_amount))}</span>
                    )}
                    {receipt.image_url && (
                      <a href={receipt.image_url} target="_blank" rel="noreferrer" className="text-primary transition-colors hover:text-primary/80">Open</a>
                    )}
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
