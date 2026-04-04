import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { computeProtectionScore, getProtectionGrade } from '../../services/gapAnalyzer';
import RecommendationCard from './RecommendationCard';
import RiskTimeline from './RiskTimeline';
import SavingsProjection from './SavingsProjection';

const CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

function getGradeDescription(grade) {
  switch (grade) {
    case 'A': return 'Excellent protection — your business is well covered across all major risk areas.';
    case 'B': return 'Good protection with minor gaps that should be addressed soon.';
    case 'C': return 'Good protection with room for improvement.';
    case 'D': return 'Your business has notable coverage gaps that leave you exposed.';
    default: return 'Your business has significant coverage gaps that need immediate attention.';
  }
}

export default function ActionPlan() {
  const { gapAnalysis, financialMetrics, setActiveTab } = useContext(AppContext);

  if (!gapAnalysis) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Action Plan</h2>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-text-secondary mb-4">
            Complete your insurance analysis first to see your personalized action plan.
          </p>
          <button
            onClick={() => setActiveTab('insurance')}
            className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Insurance Analyzer
          </button>
        </div>
      </div>
    );
  }

  const score = computeProtectionScore(gapAnalysis);
  const gradeInfo = getProtectionGrade(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const actionItems = gapAnalysis.filter(g => g.status === 'gap' || g.status === 'underinsured');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Action Plan</h2>
        <p className="text-text-secondary mt-1">
          {actionItems.length > 0
            ? `${actionItems.length} items need your attention`
            : 'Your coverage looks solid — no critical gaps found'}
        </p>
      </div>

      {/* Protection Score Gauge */}
      <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r="90"
            fill="none" stroke="#e2e8f0" strokeWidth="12"
          />
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke={gradeInfo.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px', transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x="100" y="92" textAnchor="middle" fontSize="40" fontWeight="bold" fill={gradeInfo.color}>
            {score}%
          </text>
          <text x="100" y="120" textAnchor="middle" fontSize="22" fontWeight="600" fill={gradeInfo.color}>
            {gradeInfo.grade}
          </text>
        </svg>
        <p className="text-sm text-text-secondary mt-3 text-center max-w-md">
          {getGradeDescription(gradeInfo.grade)}
        </p>
      </div>

      <RiskTimeline gaps={gapAnalysis} />

      {actionItems.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Recommendations</h3>
          <div className="space-y-3">
            {actionItems.map(item => (
              <RecommendationCard key={item.id} item={item} financialMetrics={financialMetrics} />
            ))}
          </div>
        </div>
      )}

      <SavingsProjection metrics={financialMetrics} />
    </div>
  );
}
