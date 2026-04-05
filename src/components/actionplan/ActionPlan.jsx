import { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { computeProtectionScore, getProtectionGrade } from '../../services/gapAnalyzer';
import StatValue from '../shared/StatValue';
import RecommendationCard from './RecommendationCard';
import RiskTimeline from './RiskTimeline';
import SavingsProjection from './SavingsProjection';

const MotionDiv = motion.div;
const MotionCircle = motion.circle;
const CIRCUMFERENCE = 2 * Math.PI * 90;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function getPriorityWeight(priority) {
  return { critical: 0, recommended: 1, conditional: 2 }[priority] ?? 9;
}

function getGradeDescription(grade) {
  switch (grade) {
    case 'A':
      return 'Excellent protection with only minor adjustments left to review.';
    case 'B':
      return 'Strong protection, with a few targeted insurance improvements still worth making.';
    case 'C':
      return 'Your coverage is workable, but the new action plan should tighten several meaningful weak points.';
    case 'D':
      return 'Your business has notable protection gaps that should be closed in a disciplined order.';
    default:
      return 'Your business has urgent protection gaps that need immediate action.';
  }
}

function getScoreTone(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'danger';
}

function normalizeEnvelope(envelope, fallbackGapAnalysis, financialMetrics) {
  if (envelope?.latestGapAnalysis) {
    return envelope;
  }

  if (!Array.isArray(fallbackGapAnalysis) || !fallbackGapAnalysis.length) {
    return envelope;
  }

  return {
    ...envelope,
    latestGapAnalysis: {
      id: null,
      results: fallbackGapAnalysis,
      protectionScore: computeProtectionScore(fallbackGapAnalysis, financialMetrics),
    },
    currentScore: computeProtectionScore(fallbackGapAnalysis, financialMetrics),
  };
}

export default function ActionPlan({ embedded = false, onBackToAnalysis = null }) {
  const {
    businessInfo,
    gapAnalysis,
    financialMetrics,
    riskFactors,
    navigateToTab,
  } = useContext(AppContext);
  const [envelope, setEnvelope] = useState(null);
  const [planError, setPlanError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const refreshKey = useMemo(() => JSON.stringify({
    businessId: businessInfo?.id || null,
    gapFingerprint: Array.isArray(gapAnalysis)
      ? gapAnalysis.map((item) => `${item.id}:${item.status}:${item.priority}`).join('|')
      : 'none',
    margin: Number(financialMetrics?.averageMonthlyIncome || 0) - Number(financialMetrics?.averageMonthlyExpenses || 0),
    reserves: Number(financialMetrics?.currentReserves || 0),
    riskZip: riskFactors?.zip || null,
  }), [businessInfo?.id, gapAnalysis, financialMetrics, riskFactors?.zip]);

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      if (!businessInfo?.id) {
        setEnvelope(null);
        return;
      }

      setPlanError('');
      setIsLoading(true);

      try {
        const loaded = normalizeEnvelope(
          await api.getCoverageActionPlan(businessInfo.id),
          gapAnalysis,
          financialMetrics,
        );

        if (!active) {
          return;
        }

        setEnvelope(loaded);
        setIsLoading(false);

        if (!loaded?.latestGapAnalysis) {
          return;
        }

        if (loaded.latestPlan && !loaded.stale) {
          return;
        }

        setIsGenerating(true);

        const generated = await api.generateCoverageActionPlan({
          businessId: businessInfo.id,
          financialMetrics,
          riskFactors,
        });

        if (!active) {
          return;
        }

        setEnvelope(normalizeEnvelope(generated, gapAnalysis, financialMetrics));
      } catch (error) {
        if (!active) {
          return;
        }

        setPlanError(error.message || 'Failed to load the insurance action plan.');
      } finally {
        if (active) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    }

    void loadPlan();

    return () => {
      active = false;
    };
  }, [businessInfo?.id, refreshKey, financialMetrics, gapAnalysis, riskFactors]);

  const latestGapAnalysis = envelope?.latestGapAnalysis || null;
  const latestPlan = envelope?.latestPlan || null;
  const currentScore = latestPlan?.currentScore
    ?? envelope?.currentScore
    ?? latestGapAnalysis?.protectionScore
    ?? (latestGapAnalysis?.results ? computeProtectionScore(latestGapAnalysis.results, financialMetrics) : 0);
  const projectedScore = latestPlan?.projectedScore ?? currentScore;
  const currentGrade = getProtectionGrade(currentScore);
  const projectedGrade = getProtectionGrade(projectedScore);
  const dashOffset = CIRCUMFERENCE * (1 - currentScore / 100);
  const topRisks = (latestGapAnalysis?.results || [])
    .filter((item) => item.status === 'gap' || item.status === 'underinsured')
    .sort((left, right) => getPriorityWeight(left.priority) - getPriorityWeight(right.priority))
    .slice(0, 3);
  const planItems = latestPlan?.planItems || [];
  const unsupportedCount = planItems.filter((item) => !item.officialSourceUrl).length;
  const actionCount = planItems.length;

  if (!latestGapAnalysis && !isLoading) {
    return (
      <div className="space-y-6">
        {!embedded ? (
          <div>
            <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Action Plan</h2>
          </div>
        ) : null}
        <div className="glass-card rounded-3xl p-10 text-center">
          <p className="text-base font-light text-text-secondary">
            Complete your insurance analysis first to generate a source-backed coverage improvement plan.
          </p>
          <button
            type="button"
            onClick={() => {
              if (embedded) {
                onBackToAnalysis?.();
                return;
              }

              navigateToTab('insurance', { subview: 'analysis' });
            }}
            className="mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90"
          >
            {embedded ? 'Back to Analysis' : 'Go to Insurance Analyzer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <MotionDiv {...fadeInUp} transition={{ duration: 0.35 }}>
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Action Plan</h2>
          <p className="mt-1.5 text-sm font-light text-text-secondary">
            {actionCount > 0
              ? `${actionCount} researched coverage actions, tied to your latest insurance analysis`
              : 'Building a source-backed plan from your latest policy and gap analysis'}
          </p>
        </MotionDiv>
      ) : (
        <MotionDiv {...fadeInUp} transition={{ duration: 0.35 }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Coverage action plan</p>
              <p className="mt-2 text-sm font-light text-text-secondary">
                {actionCount > 0
                  ? `${actionCount} researched coverage actions, tied to your latest insurance analysis`
                  : 'Building a source-backed plan from your latest policy and gap analysis'}
              </p>
            </div>
            {onBackToAnalysis ? (
              <button
                type="button"
                onClick={onBackToAnalysis}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-text-secondary transition-colors hover:border-white/20 hover:text-text-primary"
              >
                Back to analysis
              </button>
            ) : null}
          </div>
        </MotionDiv>
      )}

      {planError ? (
        <div className="rounded-2xl border border-gap/20 bg-gap/5 p-4 text-sm text-gap">
          {planError}
        </div>
      ) : null}

      {(isLoading || isGenerating || envelope?.stale || unsupportedCount > 0) ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading your latest insurance plan context.
              </>
            ) : null}
            {!isLoading && isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                Generating a refreshed source-backed action plan from your saved gaps.
              </>
            ) : null}
            {!isLoading && !isGenerating && envelope?.stale ? (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                Your previous plan was based on older gap data, so SafeGuard is refreshing it.
              </>
            ) : null}
            {!isLoading && !isGenerating && unsupportedCount > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                {unsupportedCount} action {unsupportedCount === 1 ? 'still needs' : 'still need'} agent review because carrier-specific fit is not fully confirmed.
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <MotionDiv
        {...fadeInUp}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.3fr)]"
      >
        <div className="glass-card flex flex-col items-center p-6">
          <div className="relative flex h-[200px] w-[200px] items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#27272a" strokeWidth="12" />
              <MotionCircle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={currentGrade.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <StatValue value={`${currentScore}%`} color={getScoreTone(currentScore)} size="xl" />
              <span className="mt-2 text-xl font-normal tracking-[-0.03em]" style={{ color: currentGrade.color }}>
                {currentGrade.grade}
              </span>
            </div>
          </div>

          <p className="mt-3 max-w-md text-center text-sm font-light text-text-secondary">
            {getGradeDescription(currentGrade.grade)}
          </p>

          <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
            <div className="surface-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Projected score</p>
              <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em]" style={{ color: projectedGrade.color }}>
                {projectedScore}%
              </p>
            </div>
            <div className="surface-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Recommended actions</p>
              <p className="mt-2 text-2xl font-heading font-light tracking-[-0.03em] text-text-primary">
                {actionCount}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Plan summary</p>
          <p className="mt-3 text-base leading-7 text-text-primary">
            {latestPlan?.planSummary || 'SafeGuard is turning your latest coverage analysis into a phased, source-backed action plan.'}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="surface-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Highest-priority risks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topRisks.length ? topRisks.map((item) => (
                  <span key={item.id} className="rounded-full bg-white/[0.05] px-3 py-1 text-sm text-text-primary">
                    {item.name}
                  </span>
                )) : (
                  <span className="text-sm text-text-secondary">No unresolved gaps found.</span>
                )}
              </div>
            </div>

            <div className="surface-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Carrier fit coverage</p>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {unsupportedCount > 0
                  ? `${actionCount - unsupportedCount} actions map cleanly to the current State Farm source catalog, and ${unsupportedCount} still need an agent-led fit check.`
                  : 'Every current action maps to the curated State Farm source catalog used by this version of SafeGuard.'}
              </p>
            </div>
          </div>
        </div>
      </MotionDiv>

      {planItems.length > 0 ? (
        <>
          <MotionDiv {...fadeInUp} transition={{ duration: 0.35, delay: 0.15 }}>
            <RiskTimeline items={planItems} />
          </MotionDiv>

          <MotionDiv {...fadeInUp} transition={{ duration: 0.35, delay: 0.2 }}>
            <h3 className="mb-3 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">
              Source-backed recommendations
            </h3>
            <div className="space-y-4">
              {planItems.map((item, index) => (
                <RecommendationCard key={item.id} item={item} delay={0.04 * index} />
              ))}
            </div>
          </MotionDiv>

          <MotionDiv {...fadeInUp} transition={{ duration: 0.35, delay: 0.25 }}>
            <SavingsProjection metrics={financialMetrics} items={planItems} projectedScore={projectedScore} />
          </MotionDiv>
        </>
      ) : (
        <div className="glass-card rounded-3xl p-8">
          <p className="text-sm text-text-secondary">
            {latestPlan?.planSummary
              || 'Your latest insurance analysis does not currently show any open source-backed action items.'}
          </p>
        </div>
      )}
    </div>
  );
}
