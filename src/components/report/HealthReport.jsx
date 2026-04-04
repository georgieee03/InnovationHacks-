import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

function computeHealthScore(financialMetrics, gapAnalysis) {
  let efScore = 0, runwayScore = 0, coverageScore = 0, trendScore = 0;

  if (financialMetrics) {
    efScore = Math.min(100, (financialMetrics.emergencyFundPercent || 0));
    const runway = financialMetrics.monthsOfRunway || 0;
    runwayScore = Math.min(100, (runway / 6) * 100);
    const breakdown = financialMetrics.monthlyBreakdown || [];
    const positive = breakdown.filter((m) => m.netCashFlow > 0).length;
    trendScore = breakdown.length > 0 ? (positive / breakdown.length) * 100 : 50;
  }

  if (gapAnalysis?.gaps) {
    const total = gapAnalysis.gaps.length;
    const covered = gapAnalysis.gaps.filter((g) => g.status === 'covered').length;
    coverageScore = total > 0 ? (covered / total) * 100 : 50;
  } else {
    coverageScore = 20;
  }

  return Math.round((efScore * 0.25 + runwayScore * 0.25 + coverageScore * 0.25 + trendScore * 0.25));
}

function getStrengths(fm, ga) {
  const strengths = [];
  if (fm) {
    const positive = (fm.monthlyBreakdown || []).filter((m) => m.netCashFlow > 0).length;
    if (positive >= 3) strengths.push(`Positive cash flow in ${positive} of ${fm.monthlyBreakdown.length} months`);
    if (fm.emergencyFundPercent >= 50) strengths.push(`Emergency fund is ${fm.emergencyFundPercent}% funded`);
    if (fm.monthsOfRunway >= 3) strengths.push(`${fm.monthsOfRunway} months of operating runway`);
    if (fm.averageMonthlyIncome > fm.averageMonthlyExpenses) strengths.push('Average income exceeds average expenses');
  }
  if (ga?.gaps) {
    const covered = ga.gaps.filter((g) => g.status === 'covered').length;
    if (covered > 0) strengths.push(`${covered} coverage area(s) fully covered`);
  }
  return strengths.length > 0 ? strengths : ['Business is operational and generating revenue'];
}

function getRisks(fm, ga, rf) {
  const risks = [];
  if (fm) {
    if (fm.monthsOfRunway < 3) risks.push(`Only ${fm.monthsOfRunway} months of runway — below 3-month minimum`);
    if (fm.emergencyFundGap > 0) risks.push(`Emergency fund gap of ${formatCurrency(fm.emergencyFundGap)}`);
    const negative = (fm.monthlyBreakdown || []).filter((m) => m.netCashFlow < 0).length;
    if (negative >= 2) risks.push(`Negative cash flow in ${negative} months`);
  }
  if (ga?.gaps) {
    const gaps = ga.gaps.filter((g) => g.status === 'gap');
    gaps.forEach((g) => risks.push(`No coverage for ${g.type || g.category}`));
  }
  if (rf) {
    if (rf.floodZone) risks.push('Located in a flood zone without flood coverage');
    if (rf.crimeRate === 'high') risks.push('High crime rate area — consider security measures');
  }
  return risks.length > 0 ? risks : ['Complete gap analysis to identify specific risks'];
}

function getRecommendations(fm, ga) {
  const recs = [];
  if (fm && fm.emergencyFundGap > 0) {
    recs.push({ action: 'Build emergency fund', cost: formatCurrency(fm.emergencyFundGap), impact: 'High', detail: 'Save monthly to close the gap within 12 months' });
  }
  if (ga?.gaps) {
    const gapItems = ga.gaps.filter((g) => g.status === 'gap');
    if (gapItems.length > 0) {
      recs.push({ action: `Get ${gapItems[0].type || 'missing'} coverage`, cost: '$500–$2,000/yr', impact: 'High', detail: 'Eliminates largest coverage gap' });
    }
    const under = ga.gaps.filter((g) => g.status === 'underinsured');
    if (under.length > 0) {
      recs.push({ action: `Increase ${under[0].type || 'underinsured'} limits`, cost: '$200–$800/yr', impact: 'Medium', detail: 'Brings coverage to recommended levels' });
    }
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
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }} className={color} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className={`text-3xl font-bold ${color}`}>{score}</motion.span>
        <span className="text-xs text-text-secondary">/ 100</span>
      </div>
    </div>
  );
}

export default function HealthReport() {
  const { financialMetrics, gapAnalysis, businessInfo, riskFactors } = useContext(AppContext);
  const [generated, setGenerated] = useState(false);

  const score = computeHealthScore(financialMetrics, gapAnalysis);
  const strengths = getStrengths(financialMetrics, gapAnalysis);
  const risks = getRisks(financialMetrics, gapAnalysis, riskFactors);
  const recommendations = getRecommendations(financialMetrics, gapAnalysis);

  const sectionAnim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="health-report">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">Financial Health Report</h2>
          <p className="text-text-secondary text-sm">AI-powered analysis of your business resilience</p>
        </div>
        <div className="flex gap-3">
          {!generated && (
            <button onClick={() => setGenerated(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition">
              <FileText className="w-4 h-4" /> Generate Report
            </button>
          )}
          {generated && (
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-sm text-text-primary hover:bg-gray-50 transition">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          )}
        </div>
      </div>

      {!generated ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-text-secondary">Click "Generate Report" to analyze your financial health</p>
        </motion.div>
      ) : (
        <div className="space-y-6 print-report">
          {/* Score */}
          <motion.div {...sectionAnim} className="bg-card rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">Overall Health Score</h3>
            <ScoreRing score={score} />
            <p className="text-center text-sm text-text-secondary mt-3">
              {score >= 70 ? 'Your business is well-protected' : score >= 40 ? 'Some areas need attention' : 'Significant risks identified — take action soon'}
            </p>
          </motion.div>

          {/* Strengths */}
          <motion.div {...sectionAnim} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-covered" />
              <h3 className="text-lg font-semibold text-text-primary">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 text-covered flex-shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Risks */}
          <motion.div {...sectionAnim} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-gap" />
              <h3 className="text-lg font-semibold text-text-primary">Risks</h3>
            </div>
            <ul className="space-y-2">
              {risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <AlertTriangle className="w-4 h-4 text-gap flex-shrink-0 mt-0.5" /> {r}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Recommendations */}
          <motion.div {...sectionAnim} transition={{ delay: 0.3 }} className="bg-card rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Top Recommendations</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{rec.action}</p>
                    <p className="text-xs text-text-secondary">{rec.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-text-primary">{rec.cost}</p>
                    <p className={`text-xs font-medium ${rec.impact === 'High' ? 'text-gap' : 'text-underinsured'}`}>{rec.impact} impact</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Trend Table */}
          {financialMetrics?.monthlyBreakdown && (
            <motion.div {...sectionAnim} transition={{ delay: 0.4 }} className="bg-card rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Trend</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-text-secondary font-medium">Month</th>
                      <th className="text-right py-2 text-text-secondary font-medium">Income</th>
                      <th className="text-right py-2 text-text-secondary font-medium">Expenses</th>
                      <th className="text-right py-2 text-text-secondary font-medium">Net Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialMetrics.monthlyBreakdown.map((m) => (
                      <tr key={m.month} className="border-b border-gray-100">
                        <td className="py-2 text-text-primary">{m.label}</td>
                        <td className="py-2 text-right text-covered">{formatCurrency(m.totalIncome)}</td>
                        <td className="py-2 text-right text-gap">{formatCurrency(m.totalExpenses)}</td>
                        <td className={`py-2 text-right font-medium ${m.netCashFlow >= 0 ? 'text-covered' : 'text-gap'}`}>{formatCurrency(m.netCashFlow)}</td>
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
