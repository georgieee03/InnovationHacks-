import { useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { computeProtectionScore, getProtectionGrade } from '../../services/gapAnalyzer';
import StatValue from '../shared/StatValue';
import RecommendationCard from './RecommendationCard';
import RiskTimeline from './RiskTimeline';
import SavingsProjection from './SavingsProjection';

const MotionDiv = motion.div;
const MotionCircle = motion.circle;

const CIRCUMFERENCE = 2 * Math.PI * 90;

function getGradeDescription(grade) {
  switch (grade) {
    case 'A':
      return 'Excellent protection - your business is well covered across all major risk areas.';
    case 'B':
      return 'Good protection with minor gaps that should be addressed soon.';
    case 'C':
      return 'Good protection with room for improvement.';
    case 'D':
      return 'Your business has notable coverage gaps that leave you exposed.';
    default:
      return 'Your business has significant coverage gaps that need immediate attention.';
  }
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ActionPlan() {
  const { gapAnalysis, financialMetrics, setActiveTab } = useContext(AppContext);

  if (!gapAnalysis) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Action Plan</h2>
        </div>
        <div className="rounded-xl border border-gray-100 bg-card p-12 text-center shadow-sm">
          <p className="mb-4 font-light text-text-secondary">
            Complete your insurance analysis first to see your personalized action plan.
          </p>
          <button
            onClick={() => setActiveTab('insurance')}
            className="rounded-lg bg-primary px-5 py-2 font-normal text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
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
  const actionItems = gapAnalysis.filter((gap) => gap.status === 'gap' || gap.status === 'underinsured');
  const scoreColor = score >= 80 ? 'success' : score >= 60 ? 'primary' : score >= 40 ? 'warning' : 'danger';

  return (
    <div className="space-y-6">
      <MotionDiv {...fadeInUp} transition={{ duration: 0.4 }}>
        <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Action Plan</h2>
        <p className="mt-1.5 text-sm font-light text-text-secondary">
          {actionItems.length > 0 ? `${actionItems.length} items need your attention` : 'Your coverage looks solid - no critical gaps found'}
        </p>
      </MotionDiv>

      <MotionDiv
        {...fadeInUp}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card flex flex-col items-center p-6"
      >
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#27272a" strokeWidth="12" />
            <MotionCircle
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
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <StatValue value={`${score}%`} color={scoreColor} size="xl" />
            <span className="mt-2 text-xl font-normal tracking-[-0.03em]" style={{ color: gradeInfo.color }}>
              {gradeInfo.grade}
            </span>
          </div>
        </div>
        <p className="mt-3 max-w-md text-center text-sm font-light text-text-secondary">
          {getGradeDescription(gradeInfo.grade)}
        </p>
      </MotionDiv>

      <MotionDiv {...fadeInUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <RiskTimeline gaps={gapAnalysis} />
      </MotionDiv>

      {actionItems.length > 0 && (
        <MotionDiv {...fadeInUp} transition={{ duration: 0.4, delay: 0.4 }}>
          <h3 className="mb-3 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Recommendations</h3>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <RecommendationCard key={item.id} item={item} financialMetrics={financialMetrics} delay={0.05 * index} />
            ))}
          </div>
        </MotionDiv>
      )}

      <MotionDiv {...fadeInUp} transition={{ duration: 0.4, delay: 0.5 }}>
        <SavingsProjection metrics={financialMetrics} />
      </MotionDiv>
    </div>
  );
}
