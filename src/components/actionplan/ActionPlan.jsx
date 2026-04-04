import { useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { computeProtectionScore, getProtectionGrade } from '../../services/gapAnalyzer';
import RecommendationCard from './RecommendationCard';
import RiskTimeline from './RiskTimeline';
import SavingsProjection from './SavingsProjection';

const CIRCUMFERENCE = 2 * Math.PI * 90;

function getGradeDescription(grade) {
  switch (grade) {
    case 'A':
      return 'Excellent protection. Your business is well covered across the major risk areas.';
    case 'B':
      return 'Good protection with smaller gaps that should be addressed soon.';
    case 'C':
      return 'Fair protection with clear room for improvement.';
    case 'D':
      return 'Your business has notable coverage gaps that leave you exposed.';
    default:
      return 'Your business has significant coverage gaps that need immediate attention.';
  }
}

function buildQuoteSearchUrl(item, businessInfo) {
  const parts = [
    item.name,
    businessInfo?.type,
    businessInfo?.city,
    businessInfo?.state,
    'small business insurance quote',
  ].filter(Boolean);

  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ActionPlan() {
  const { gapAnalysis, financialMetrics, businessInfo, setActiveTab } = useContext(AppContext);

  if (!gapAnalysis) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Action Plan</h2>
        </div>
        <div className="rounded-xl border border-gray-100 bg-card p-12 text-center shadow-sm">
          <p className="mb-4 text-text-secondary">
            Complete your insurance analysis first to see your personalized action plan.
          </p>
          <button
            onClick={() => setActiveTab('insurance')}
            className="rounded-lg bg-primary px-5 py-2 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Go to Insurance Analyzer
          </button>
        </div>
      </div>
    );
  }

  const score = computeProtectionScore(gapAnalysis, financialMetrics);
  const gradeInfo = getProtectionGrade(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const actionItems = gapAnalysis.filter((gap) => gap.status === 'gap' || gap.status === 'underinsured');

  const handleGetQuote = (item) => {
    const url = buildQuoteSearchUrl(item, businessInfo);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Action Plan</h2>
        <p className="mt-1 text-text-secondary">
          {actionItems.length > 0
            ? `${actionItems.length} items need your attention`
            : 'Your coverage looks solid. No critical gaps found.'}
        </p>
      </motion.div>

      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center rounded-xl border border-gray-100 bg-card p-6 shadow-sm"
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={gradeInfo.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
          />
          <text x="100" y="92" textAnchor="middle" fontSize="40" fontWeight="bold" fill={gradeInfo.color}>
            {score}%
          </text>
          <text x="100" y="120" textAnchor="middle" fontSize="22" fontWeight="600" fill={gradeInfo.color}>
            {gradeInfo.grade}
          </text>
        </svg>
        <p className="mt-3 max-w-md text-center text-sm text-text-secondary">
          {getGradeDescription(gradeInfo.grade)}
        </p>
      </motion.div>

      <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <RiskTimeline gaps={gapAnalysis} />
      </motion.div>

      {actionItems.length > 0 && (
        <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <h3 className="mb-3 text-lg font-heading font-semibold text-text-primary">Recommendations</h3>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <RecommendationCard
                key={item.id}
                item={item}
                financialMetrics={financialMetrics}
                delay={0.05 * index}
                onGetQuote={handleGetQuote}
              />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.5 }}>
        <SavingsProjection metrics={financialMetrics} />
      </motion.div>
    </div>
  );
}
