import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

function getGapItems(gapAnalysis) {
  if (Array.isArray(gapAnalysis)) {
    return gapAnalysis;
  }

  return gapAnalysis?.gaps ?? [];
}

function computeHealthScore(financialMetrics, gapAnalysis) {
  let efScore = 0;
  let runwayScore = 0;
  let coverageScore = 0;
  let trendScore = 0;

  if (financialMetrics) {
    efScore = Math.min(100, financialMetrics.emergencyFundPercent || 0);
    const runway = financialMetrics.monthsOfRunway || 0;
    runwayScore = Math.min(100, (runway / 6) * 100);
    const breakdown = financialMetrics.monthlyBreakdown || [];
    const positive = breakdown.filter((m) => m.netCashFlow > 0).length;
    trendScore = breakdown.length > 0 ? (positive / breakdown.length) * 100 : 50;
  }

  const gaps = getGapItems(gapAnalysis);
  if (gaps.length > 0) {
    const covered = gaps.filter((g) => g.status === 'covered').length;
    coverageScore = (covered / gaps.length) * 100;
  } else {
    coverageScore = 20;
  }

  return Math.round((efScore * 0.25) + (runwayScore * 0.25) + (coverageScore * 0.25) + (trendScore * 0.25));
}

function getStrengths(financialMetrics, gapAnalysis) {
  const strengths = [];

  if (financialMetrics) {
    const positive = (financialMetrics.monthlyBreakdown || []).filter((m) => m.netCashFlow > 0).length;
    if (positive >= 3) strengths.push(`Positive cash flow in ${positive} of ${financialMetrics.monthlyBreakdown.length} months`);
    if (financialMetrics.emergencyFundPercent >= 50) strengths.push(`Emergency fund is ${financialMetrics.emergencyFundPercent}% funded`);
    if (financialMetrics.monthsOfRunway >= 3) strengths.push(`${financialMetrics.monthsOfRunway} months of operating runway`);
    if (financialMetrics.averageMonthlyIncome > financialMetrics.averageMonthlyExpenses) strengths.push('Average income exceeds average expenses');
  }

  const gaps = getGapItems(gapAnalysis);
  const covered = gaps.filter((g) => g.status === 'covered').length;
  if (covered > 0) strengths.push(`${covered} coverage area(s) fully covered`);

  return strengths.length > 0 ? strengths : ['Business is operational and generating revenue'];
}

function getRisks(financialMetrics, gapAnalysis, riskFactors) {
  const risks = [];

  if (financialMetrics) {
    if (financialMetrics.monthsOfRunway < 3) risks.push(`Only ${financialMetrics.monthsOfRunway} months of runway - below 3-month minimum`);
    if (financialMetrics.emergencyFundGap > 0) risks.push(`Emergency fund gap of ${formatCurrency(financialMetrics.emergencyFundGap)}`);
    const negative = (financialMetrics.monthlyBreakdown || []).filter((m) => m.netCashFlow < 0).length;
    if (negative >= 2) risks.push(`Negative cash flow in ${negative} months`);
  }

  const gaps = getGapItems(gapAnalysis);
  gaps.filter((g) => g.status === 'gap').forEach((g) => {
    risks.push(`No coverage for ${g.name || g.id || g.type || 'a key risk area'}`);
  });

  const locationRisks = Object.values(riskFactors?.risks ?? {});
  locationRisks.forEach((risk) => {
    if (risk.level === 'high') {
      risks.push(`${risk.label} - ${risk.description}`);
    }
  });

  return risks.length > 0 ? risks : ['Complete gap analysis to identify specific risks'];
}

function getRecommendations(financialMetrics, gapAnalysis) {
  const recs = [];

  if (financialMetrics?.emergencyFundGap > 0) {
    recs.push({ action: 'Build emergency fund', cost: formatCurrency(financialMetrics.emergencyFundGap), impact: 'High', detail: 'Save monthly to close the gap within 12 months' });
  }

  const gaps = getGapItems(gapAnalysis);
  const gapItems = gaps.filter((g) => g.status === 'gap');
  if (gapItems.length > 0) {
    recs.push({ action: `Get ${gapItems[0].name || gapItems[0].id || 'missing'} coverage`, cost: '$500-$2,000/yr', impact: 'High', detail: 'Eliminates the largest coverage gap' });
  }

  const underinsured = gaps.filter((g) => g.status === 'underinsured');
  if (underinsured.length > 0) {
    recs.push({ action: `Increase ${underinsured[0].name || underinsured[0].id || 'underinsured'} limits`, cost: '$200-$800/yr', impact: 'Medium', detail: 'Brings coverage to recommended levels' });
  }

  if (recs.length < 3) {
    recs.push({ action: 'Schedule annual policy review', cost: 'Free', impact: 'Medium', detail: 'Ensure coverage keeps pace with business growth' });
  }

  return recs.slice(0, 3);
}

function ScoreRing({ score }) {
  const color = score >= 70 ? 'text-covered' : score >= 40 ? 'text-underinsured' : 'text-gap';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className={`text-3xl font-bold ${color}`}>{score}</motion.span>
        <span className="text-xs text-text-secondary">/ 100</span>
      </div>
    </div>
  );
}

export default function HealthReport() {
  const { financialMetrics, gapAnalysis, riskFactors } = useContext(AppContext);
  const [generated, setGenerated] = useState(false);

  const score = computeHealthScore(financialMetrics, gapAnalysis);
  const strengths = getStrengths(financialMetrics, gapAnalysis);
  const risks = getRisks(financialMetrics, gapAnalysis, riskFactors);
  const recommendations = getRecommendations(financialMetrics, gapAnalysis);
  const sectionAnim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="health-report">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-text-primary">Financial Health Report</h2>
          <p className="text-sm text-text-secondary">AI-powered analysis of your business resilience</p>
        </div>
        <div className="flex gap-3">
          {!generated && (
            <button onClick={() => setGenerated(true)} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90">
              <FileText className="h-4 w-4" /> Generate Report
            </button>
          )}
          {generated && (
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-gray-50">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          )}
        </div>
      </div>

      {!generated ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 text-center shadow-md">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-text-secondary">Click "Generate Report" to analyze your financial health</p>
        </motion.div>
      ) : (
        <div className="print-report space-y-6">
          <motion.div {...sectionAnim} className="rounded-xl bg-card p-6 shadow-md">
            <h3 className="mb-4 text-center text-lg font-semibold text-text-primary">Overall Health Score</h3>
            <ScoreRing score={score} />
            <p className="mt-3 text-center text-sm text-text-secondary">
              {score >= 70 ? 'Your business is well-protected' : score >= 40 ? 'Some areas need attention' : 'Significant risks identified - take action soon'}
            </p>
          </motion.div>

          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="rounded-xl bg-card p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-covered" />
              <h3 className="text-lg font-semibold text-text-primary">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-covered" /> {strength}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...sectionAnim} transition={{ delay: 0.2 }} className="rounded-xl bg-card p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gap" />
              <h3 className="text-lg font-semibold text-text-primary">Risks</h3>
            </div>
            <ul className="space-y-2">
              {risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gap" /> {risk}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...sectionAnim} transition={{ delay: 0.3 }} className="rounded-xl bg-card p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Top Recommendations</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-4 rounded-lg bg-gray-50 p-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{recommendation.action}</p>
                    <p className="text-xs text-text-secondary">{recommendation.detail}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-text-primary">{recommendation.cost}</p>
                    <p className={`text-xs font-medium ${recommendation.impact === 'High' ? 'text-gap' : 'text-underinsured'}`}>{recommendation.impact} impact</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {financialMetrics?.monthlyBreakdown && (
            <motion.div {...sectionAnim} transition={{ delay: 0.4 }} className="rounded-xl bg-card p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Monthly Trend</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 text-left font-medium text-text-secondary">Month</th>
                      <th className="py-2 text-right font-medium text-text-secondary">Income</th>
                      <th className="py-2 text-right font-medium text-text-secondary">Expenses</th>
                      <th className="py-2 text-right font-medium text-text-secondary">Net Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialMetrics.monthlyBreakdown.map((month) => (
                      <tr key={month.month} className="border-b border-gray-100">
                        <td className="py-2 text-text-primary">{month.label}</td>
                        <td className="py-2 text-right text-covered">{formatCurrency(month.totalIncome)}</td>
                        <td className="py-2 text-right text-gap">{formatCurrency(month.totalExpenses)}</td>
                        <td className={`py-2 text-right font-medium ${month.netCashFlow >= 0 ? 'text-covered' : 'text-gap'}`}>{formatCurrency(month.netCashFlow)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
