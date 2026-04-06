import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  FileText, Download, TrendingUp, AlertTriangle, CheckCircle,
  Lightbulb, Share2, Copy, Check, ShieldCheck, DollarSign, Clock,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

// ─── Score helpers ─────────────────────────────────────────────────────────────

function getGapItems(gapAnalysis) {
  if (Array.isArray(gapAnalysis)) return gapAnalysis;
  if (Array.isArray(gapAnalysis?.gaps)) return gapAnalysis.gaps;
  return [];
}

function computeHealthScore(financialMetrics, gapAnalysis) {
  const gapItems = getGapItems(gapAnalysis);
  let efScore = 0, runwayScore = 0, coverageScore = 0, trendScore = 0;

  if (financialMetrics) {
    efScore = Math.min(100, financialMetrics.emergencyFundPercent || 0);
    runwayScore = Math.min(100, ((financialMetrics.monthsOfRunway || 0) / 6) * 100);
    const bd = financialMetrics.monthlyBreakdown || [];
    trendScore = bd.length > 0 ? (bd.filter((m) => m.netCashFlow > 0).length / bd.length) * 100 : 50;
  }
  coverageScore = gapItems.length > 0
    ? (gapItems.filter((g) => g.status === 'covered').length / gapItems.length) * 100
    : 20;

  return Math.round(efScore * 0.25 + runwayScore * 0.25 + coverageScore * 0.25 + trendScore * 0.25);
}

function getStrengths(financialMetrics, gapAnalysis) {
  const s = [];
  const gi = getGapItems(gapAnalysis);
  if (financialMetrics) {
    const bd = financialMetrics.monthlyBreakdown || [];
    const pos = bd.filter((m) => m.netCashFlow > 0).length;
    if (pos >= 3) s.push(`Positive cash flow in ${pos} of ${bd.length} months`);
    if (financialMetrics.emergencyFundPercent >= 50) s.push(`Emergency fund is ${financialMetrics.emergencyFundPercent}% funded`);
    if (financialMetrics.monthsOfRunway >= 3) s.push(`${financialMetrics.monthsOfRunway} months of operating runway`);
    if (financialMetrics.averageMonthlyIncome > financialMetrics.averageMonthlyExpenses) s.push('Average income exceeds average expenses');
  }
  const covered = gi.filter((g) => g.status === 'covered').length;
  if (covered > 0) s.push(`${covered} coverage area${covered > 1 ? 's' : ''} fully covered`);
  return s.length > 0 ? s : ['Business is operational and generating revenue'];
}

function getRisks(financialMetrics, gapAnalysis, riskFactors) {
  const r = [];
  const gi = getGapItems(gapAnalysis);
  const riskMap = riskFactors?.risks ?? {};
  if (financialMetrics) {
    if (financialMetrics.monthsOfRunway < 3) r.push(`Only ${financialMetrics.monthsOfRunway} months of runway (3-month minimum recommended)`);
    if (financialMetrics.emergencyFundGap > 0) r.push(`Emergency fund gap of ${formatCurrency(financialMetrics.emergencyFundGap)}`);
    const neg = (financialMetrics.monthlyBreakdown || []).filter((m) => m.netCashFlow < 0).length;
    if (neg >= 2) r.push(`Negative cash flow in ${neg} months`);
  }
  gi.filter((g) => g.status === 'gap').forEach((g) => r.push(`No coverage for ${g.type || g.category}`));
  if (riskFactors?.floodZone || riskMap.flood_zone) r.push('Located in a flood zone without flood coverage');
  if (riskFactors?.crimeRate === 'high' || riskMap.crime?.level === 'high') r.push('High crime rate area — consider additional security');
  return r.length > 0 ? r : ['Complete gap analysis to identify specific risks'];
}

function getRecommendations(financialMetrics, gapAnalysis) {
  const rec = [];
  const gi = getGapItems(gapAnalysis);
  if (financialMetrics?.emergencyFundGap > 0) {
    rec.push({ action: 'Build emergency fund', cost: formatCurrency(financialMetrics.emergencyFundGap), impact: 'High', detail: 'Save monthly to close the gap within 12 months' });
  }
  const uncovered = gi.filter((g) => g.status === 'gap');
  if (uncovered.length > 0) rec.push({ action: `Get ${uncovered[0].type || 'missing'} coverage`, cost: '$500–$2,000/yr', impact: 'High', detail: 'Eliminates the largest coverage gap' });
  const under = gi.filter((g) => g.status === 'underinsured');
  if (under.length > 0) rec.push({ action: `Increase ${under[0].type || 'underinsured'} limits`, cost: '$200–$800/yr', impact: 'Medium', detail: 'Brings coverage to recommended levels' });
  if (rec.length < 3) rec.push({ action: 'Schedule annual policy review', cost: 'Free', impact: 'Medium', detail: 'Ensure coverage keeps pace with business growth' });
  return rec.slice(0, 3);
}

// ─── PDF generator ─────────────────────────────────────────────────────────────

function generatePDF({ businessInfo, financialMetrics, gapAnalysis, riskFactors }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const score = computeHealthScore(financialMetrics, gapAnalysis);
  const strengths = getStrengths(financialMetrics, gapAnalysis);
  const risks = getRisks(financialMetrics, gapAnalysis, riskFactors);
  const recommendations = getRecommendations(financialMetrics, gapAnalysis);
  const gapItems = getGapItems(gapAnalysis);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const scoreColor = score >= 70 ? [0, 168, 84] : score >= 40 ? [234, 179, 8] : [239, 68, 68];
  const pg = { x: 20, y: 0 };

  // ── Header bar
  doc.setFillColor(10, 10, 20);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SafeGuard', 20, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 180);
  doc.text('Business Resilience Report', 20, 19);
  doc.setTextColor(120, 120, 140);
  doc.text(dateStr, W - 20, 19, { align: 'right' });

  // ── Business block
  pg.y = 38;
  doc.setTextColor(30, 30, 40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo?.name || 'Your Business', pg.x, pg.y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 120);
  const meta = [businessInfo?.type, businessInfo?.city && businessInfo?.state ? `${businessInfo.city}, ${businessInfo.state}` : null, businessInfo?.employees ? `${businessInfo.employees} employee${businessInfo.employees !== 1 ? 's' : ''}` : null].filter(Boolean).join('  ·  ');
  if (meta) doc.text(meta, pg.x, pg.y + 6);

  // ── Score circle area
  pg.y += 20;
  doc.setFillColor(...scoreColor);
  doc.circle(W / 2, pg.y + 18, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(score), W / 2, pg.y + 21, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100', W / 2, pg.y + 28, { align: 'center' });
  doc.setTextColor(80, 80, 100);
  doc.setFontSize(10);
  const scoreLabel = score >= 70 ? 'Well Protected' : score >= 40 ? 'Needs Attention' : 'At Risk';
  doc.text(scoreLabel, W / 2, pg.y + 40, { align: 'center' });

  // ── Key metrics row
  pg.y += 52;
  const metrics = [
    { label: 'Monthly Income', value: financialMetrics ? formatCurrency(financialMetrics.averageMonthlyIncome || 0) : '—' },
    { label: 'Monthly Expenses', value: financialMetrics ? formatCurrency(financialMetrics.averageMonthlyExpenses || 0) : '—' },
    { label: 'Runway', value: financialMetrics ? `${financialMetrics.monthsOfRunway || 0} mo` : '—' },
    { label: 'Coverage', value: gapItems.length > 0 ? `${Math.round((gapItems.filter((g) => g.status === 'covered').length / gapItems.length) * 100)}%` : '—' },
  ];
  const boxW = (W - 40) / metrics.length;
  metrics.forEach((m, i) => {
    const bx = pg.x + i * (boxW + 2);
    doc.setFillColor(245, 246, 250);
    doc.roundedRect(bx, pg.y, boxW, 16, 2, 2, 'F');
    doc.setTextColor(30, 30, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, bx + boxW / 2, pg.y + 7, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text(m.label, bx + boxW / 2, pg.y + 13, { align: 'center' });
  });

  // ── Section helper
  function section(title, yPos) {
    doc.setFillColor(245, 246, 250);
    doc.rect(pg.x, yPos, W - 40, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 80);
    doc.text(title.toUpperCase(), pg.x + 3, yPos + 5);
    return yPos + 12;
  }

  function bullet(text, yPos, color = [80, 80, 100]) {
    doc.setFillColor(...color);
    doc.circle(pg.x + 2, yPos - 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - 50);
    doc.text(lines, pg.x + 6, yPos);
    return yPos + lines.length * 5 + 1;
  }

  // ── Strengths
  pg.y += 24;
  pg.y = section('Strengths', pg.y);
  strengths.slice(0, 4).forEach((s) => { pg.y = bullet(s, pg.y, [0, 140, 70]); });

  // ── Risks
  pg.y += 4;
  pg.y = section('Key Risks', pg.y);
  risks.slice(0, 4).forEach((r) => { pg.y = bullet(r, pg.y, [200, 50, 50]); });

  // ── Recommendations
  pg.y += 4;
  pg.y = section('Top Recommendations', pg.y);
  recommendations.forEach((rec, i) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text(`${i + 1}. ${rec.action}`, pg.x + 2, pg.y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 120);
    doc.text(`${rec.detail}  ·  ${rec.cost}  ·  ${rec.impact} impact`, pg.x + 6, pg.y + 5);
    pg.y += 11;
  });

  // ── Monthly breakdown (if available)
  const bd = financialMetrics?.monthlyBreakdown || [];
  if (bd.length > 0) {
    if (pg.y > 230) { doc.addPage(); pg.y = 20; }
    pg.y += 4;
    pg.y = section('Monthly Cash Flow', pg.y);
    const colW = (W - 40) / 4;
    ['Month', 'Income', 'Expenses', 'Net'].forEach((h, i) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 100);
      doc.text(h, pg.x + i * colW + (i > 0 ? colW - 2 : 0), pg.y, { align: i > 0 ? 'right' : 'left' });
    });
    pg.y += 4;
    bd.slice(0, 6).forEach((m) => {
      const nc = m.netCashFlow || 0;
      [m.label, formatCurrency(m.totalIncome), formatCurrency(m.totalExpenses), formatCurrency(nc)].forEach((v, i) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(i === 3 ? (nc >= 0 ? 0 : 200) : 60, i === 3 ? (nc >= 0 ? 130 : 50) : 60, 60);
        doc.text(String(v), pg.x + i * colW + (i > 0 ? colW - 2 : 0), pg.y, { align: i > 0 ? 'right' : 'left' });
      });
      pg.y += 5.5;
    });
  }

  // ── Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 285, W, 12, 'F');
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(7);
    doc.text('SafeGuard · Business Resilience Platform', 20, 292);
    doc.text(`Page ${i} of ${pageCount}`, W - 20, 292, { align: 'right' });
  }

  doc.save(`${(businessInfo?.name || 'business').replace(/\s+/g, '-').toLowerCase()}-health-report.pdf`);
}

// ─── Share helper ──────────────────────────────────────────────────────────────

function buildShareText({ businessInfo, financialMetrics, gapAnalysis, riskFactors }) {
  const score = computeHealthScore(financialMetrics, gapAnalysis);
  const risks = getRisks(financialMetrics, gapAnalysis, riskFactors);
  const recs = getRecommendations(financialMetrics, gapAnalysis);
  const label = score >= 70 ? 'Well Protected' : score >= 40 ? 'Needs Attention' : 'At Risk';
  const name = businessInfo?.name || 'My Business';
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return [
    `📊 ${name} — SafeGuard Health Report (${date})`,
    ``,
    `Overall Score: ${score}/100 — ${label}`,
    ``,
    `⚠️ Top Risks:`,
    ...risks.slice(0, 3).map((r) => `  • ${r}`),
    ``,
    `💡 Recommendations:`,
    ...recs.map((r, i) => `  ${i + 1}. ${r.action} (${r.impact} impact)`),
    ``,
    `Generated by SafeGuard · safeguard-nu.vercel.app`,
  ].join('\n');
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const color = score >= 70 ? 'text-covered' : score >= 40 ? 'text-warning' : 'text-gap';
  const stroke = score >= 70 ? '#00cf31' : score >= 40 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" stroke={stroke}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}
          className={`text-3xl font-light ${color}`}
        >{score}</motion.span>
        <span className="text-xs text-text-secondary">/ 100</span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function HealthReport() {
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = useContext(AppContext);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const score = computeHealthScore(financialMetrics, gapAnalysis);
  const strengths = getStrengths(financialMetrics, gapAnalysis);
  const risks = getRisks(financialMetrics, gapAnalysis, riskFactors);
  const recommendations = getRecommendations(financialMetrics, gapAnalysis);
  const gapItems = getGapItems(gapAnalysis);

  const scoreLabel = score >= 70 ? 'Well Protected' : score >= 40 ? 'Needs Attention' : 'At Risk';
  const scoreColor = score >= 70 ? 'text-covered' : score >= 40 ? 'text-warning' : 'text-gap';

  async function handleDownload() {
    setDownloading(true);
    try {
      generatePDF({ businessInfo, financialMetrics, gapAnalysis, riskFactors });
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  }

  async function handleShare() {
    const text = buildShareText({ businessInfo, financialMetrics, gapAnalysis, riskFactors });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="surface-panel-strong rounded-[30px] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Health Report</p>
            <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">
              Business resilience snapshot
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              AI-powered analysis of financial health, insurance coverage, and risk exposure.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!generated ? (
              <RippleButton variant="primary" size="md" onClick={() => setGenerated(true)}>
                <FileText className="h-4 w-4" /> Generate Report
              </RippleButton>
            ) : (
              <>
                <RippleButton variant="secondary" size="md" onClick={handleShare}>
                  {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Share2 className="h-4 w-4" /> Share</>}
                </RippleButton>
                <RippleButton variant="primary" size="md" onClick={handleDownload} disabled={downloading}>
                  <Download className="h-4 w-4" />
                  {downloading ? 'Generating PDF…' : 'Download PDF'}
                </RippleButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!generated && (
        <motion.div {...fade} animate={{ opacity: 1, y: 0 }}
          className="surface-panel rounded-[30px] p-16 text-center"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-text-secondary">
            Generate your full report to see your health score, top risks, and a downloadable PDF.
          </p>
        </motion.div>
      )}

      {generated && (
        <div className="space-y-5">
          {/* Score + metrics row */}
          <motion.div {...fade} className="grid gap-4 sm:grid-cols-[auto_1fr]">
            {/* Score card */}
            <div className="surface-panel-strong rounded-[30px] p-6 flex flex-col items-center justify-center gap-3 sm:min-w-[200px]">
              <ScoreRing score={score} />
              <div className="text-center">
                <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
                <p className="mt-1 text-xs text-text-secondary">Overall health score</p>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Monthly Income',
                  value: financialMetrics ? formatCurrency(financialMetrics.averageMonthlyIncome || 0) : '—',
                  icon: TrendingUp, color: 'text-covered',
                },
                {
                  label: 'Monthly Expenses',
                  value: financialMetrics ? formatCurrency(financialMetrics.averageMonthlyExpenses || 0) : '—',
                  icon: DollarSign, color: 'text-gap',
                },
                {
                  label: 'Runway',
                  value: financialMetrics ? `${financialMetrics.monthsOfRunway || 0} months` : '—',
                  icon: Clock, color: 'text-primary',
                },
                {
                  label: 'Coverage',
                  value: gapItems.length > 0
                    ? `${Math.round((gapItems.filter((g) => g.status === 'covered').length / gapItems.length) * 100)}%`
                    : '—',
                  icon: ShieldCheck, color: 'text-covered',
                },
              ].map((m) => (
                <div key={m.label} className="surface-panel rounded-3xl p-4">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                  <p className="mt-3 text-xl font-light text-text-primary">{m.value}</p>
                  <p className="mt-1 text-xs text-text-secondary">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Strengths + Risks */}
          <motion.div {...fade} transition={{ delay: 0.08 }} className="grid gap-4 lg:grid-cols-2">
            <div className="surface-panel rounded-[30px] p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-covered" />
                <p className="text-sm font-medium text-text-primary">Strengths</p>
              </div>
              <ul className="space-y-2.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-covered" />
                    <span className="text-sm leading-6 text-text-secondary">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-panel rounded-[30px] p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gap" />
                <p className="text-sm font-medium text-text-primary">Key Risks</p>
              </div>
              <ul className="space-y-2.5">
                {risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gap" />
                    <span className="text-sm leading-6 text-text-secondary">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div {...fade} transition={{ delay: 0.16 }} className="surface-panel rounded-[30px] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-text-primary">Top Recommendations</p>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="surface-panel flex items-start gap-4 rounded-3xl p-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{rec.action}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{rec.detail}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-text-primary">{rec.cost}</p>
                    <p className={`mt-0.5 text-xs ${rec.impact === 'High' ? 'text-gap' : 'text-warning'}`}>
                      {rec.impact} impact
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly breakdown */}
          {financialMetrics?.monthlyBreakdown?.length > 0 && (
            <motion.div {...fade} transition={{ delay: 0.24 }} className="surface-panel rounded-[30px] p-6">
              <p className="mb-4 text-sm font-medium text-text-primary">Monthly Cash Flow</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Month', 'Income', 'Expenses', 'Net'].map((h) => (
                        <th key={h} className={`py-2 text-xs uppercase tracking-[0.06em] text-text-secondary ${h === 'Month' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {financialMetrics.monthlyBreakdown.map((m) => (
                      <tr key={m.month} className="border-b border-white/[0.03]">
                        <td className="py-2.5 text-text-primary">{m.label}</td>
                        <td className="py-2.5 text-right text-covered">{formatCurrency(m.totalIncome)}</td>
                        <td className="py-2.5 text-right text-gap">{formatCurrency(m.totalExpenses)}</td>
                        <td className={`py-2.5 text-right font-medium ${m.netCashFlow >= 0 ? 'text-covered' : 'text-gap'}`}>
                          {formatCurrency(m.netCashFlow)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Share CTA */}
          <motion.div {...fade} transition={{ delay: 0.32 }}
            className="surface-panel rounded-[30px] p-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">Share with your accountant or banker</p>
              <p className="text-xs text-text-secondary mt-0.5">Copies a formatted summary to your clipboard — ready to paste in any email or message.</p>
            </div>
            <button
              onClick={handleShare}
              className="flex flex-shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-text-primary transition hover:bg-white/[0.08]"
            >
              {copied ? <><Check className="h-4 w-4 text-covered" /> Copied to clipboard</> : <><Copy className="h-4 w-4" /> Copy summary</>}
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
