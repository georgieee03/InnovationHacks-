import { useState, useContext, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Sparkles, ClipboardCheck, Shield } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { api } from '../../services/apiClient';
import { analyzeGaps, computeProtectionScore } from '../../services/gapAnalyzer';
import localRecommendations from '../../data/coverageRecommendations.json';
import useCoverageActionPlan from '../../hooks/useCoverageActionPlan';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';
import StatValue from '../shared/StatValue';
import RecommendationCard from '../actionplan/RecommendationCard';
import RiskTimeline from '../actionplan/RiskTimeline';
import SavingsProjection from '../actionplan/SavingsProjection';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
const MotionDiv = motion.div;
const MotionCircle = motion.circle;
const CIRCUMFERENCE = 2 * Math.PI * 90;

const DEMO_POLICY_TEXT = `Named insured: Maria's Bakery LLC
Policy number: BOP-2024-TX-00847291
Insurer: Gulf States Mutual Insurance Co.
Effective dates: 2024-03-15 to 2025-03-15
General Liability: $500,000 per occurrence, $1,000 deductible
Commercial Property: $100,000, $2,500 deductible
Workers Compensation: statutory Texas coverage
Flood Insurance: excluded
Earthquake Insurance: excluded
Equipment Breakdown: excluded
Business Interruption: excluded
Cyber Liability: excluded
Commercial Auto: excluded
Annual premium: $4,570`;

const SUBVIEWS = [
  { id: 'analysis', label: 'Analysis', icon: Shield },
  { id: 'action-plan', label: 'Action Plan', icon: ClipboardCheck },
];

function getFallbackRecommendations(businessType) {
  return localRecommendations[businessType]?.recommendedPolicies ?? [];
}

function getAnalysisErrorMessage(error, fallbackMessage) {
  if (!error?.message || error.message === 'Failed to fetch') {
    return 'Could not reach the insurance analysis API. If you are running locally, make sure the backend server is running.';
  }

  return error.message || fallbackMessage;
}

export default function InsuranceAnalyzer() {
  const {
    businessInfo,
    riskFactors,
    financialMetrics,
    policySummary, setPolicySummary,
    gapAnalysis, setGapAnalysis,
    ensureBusinessRecord,
    insuranceSubview,
    setInsuranceSubview,
  } = useContext(AppContext);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(Boolean(policySummary && gapAnalysis));
  const [analysisError, setAnalysisError] = useState('');

  // Action Plan hook - only auto-load when viewing action plan
  const actionPlan = useCoverageActionPlan({ autoLoad: insuranceSubview === 'action-plan' });

  // Reset subview to analysis when a new policy is uploaded
  useEffect(() => {
    if (isAnalyzing) {
      setInsuranceSubview('analysis');
    }
  }, [isAnalyzing, setInsuranceSubview]);

  // Update isComplete when context changes (e.g., from other components)
  useEffect(() => {
    setIsComplete(Boolean(policySummary && gapAnalysis));
  }, [policySummary, gapAnalysis]);

  const resetAnalysis = useCallback(() => {
    setIsComplete(false);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);
    actionPlan.resetPlan();
    setInsuranceSubview('analysis');
  }, [setGapAnalysis, setPolicySummary, actionPlan, setInsuranceSubview]);

  const completeAnalysis = useCallback(async (policyText, options = {}) => {
    const activeBusiness = options.persistedBusiness || businessInfo;
    const businessType = activeBusiness?.type || 'restaurant';
    const summary = await analyzePolicyWithLLM(policyText, activeBusiness, options);
    setPolicySummary(summary);

    let recommendations;
    try {
      recommendations = await api.getRecommendations(businessType);
    } catch (error) {
      console.warn('Recommendations API failed, using local fallback:', error);
      recommendations = getFallbackRecommendations(businessType);
    }

    const gaps = analyzeGaps(summary, recommendations, riskFactors, financialMetrics);
    setGapAnalysis(gaps);

    if (activeBusiness?.id) {
      const protectionScore = computeProtectionScore(gaps, financialMetrics);
      try {
        await api.saveGapAnalysis({
          businessId: activeBusiness.id,
          policyAnalysisId: summary.policyAnalysisId ?? null,
          results: gaps,
          protectionScore,
        });
      } catch (error) {
        console.warn('Gap analysis save failed:', error);
      }
    }

    setIsComplete(true);
  }, [businessInfo, financialMetrics, riskFactors, setGapAnalysis, setPolicySummary]);

  const handleFileSelect = useCallback(async (file) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);
    actionPlan.resetPlan();

    try {
      const policyText = await extractTextFromPDF(file);
      const persistedBusiness = await ensureBusinessRecord();
      const uploadedFile = await api.uploadWorkspaceFile('insurance', file);
      await completeAnalysis(policyText, {
        uploadedFileId: uploadedFile.id,
        persistedBusiness,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(
        getAnalysisErrorMessage(error, 'We could not analyze that PDF. Try the demo policy or upload a text-based PDF.')
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [completeAnalysis, ensureBusinessRecord, actionPlan, setGapAnalysis, setPolicySummary]);

  const handleLoadDemo = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);
    actionPlan.resetPlan();

    try {
      const resp = await fetch('/demo-policies/marias-bakery-policy.pdf');
      if (!resp.ok) {
        throw new Error('Demo PDF unavailable');
      }
      const blob = await resp.blob();
      const file = new File([blob], 'marias-bakery-policy.pdf', { type: 'application/pdf' });
      const policyText = await extractTextFromPDF(file);
      await completeAnalysis(policyText, { allowDemoFallback: true });
    } catch (error) {
      console.warn('Demo PDF load failed, using embedded fallback:', error);
      try {
        await completeAnalysis(DEMO_POLICY_TEXT, { allowDemoFallback: true });
      } catch (analysisFailure) {
        console.error('Demo load failed:', analysisFailure);
        setAnalysisError(getAnalysisErrorMessage(analysisFailure, 'The demo policy could not be analyzed right now.'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [completeAnalysis, actionPlan, setGapAnalysis, setPolicySummary]);

  const handleRunActionPlan = useCallback(() => {
    setInsuranceSubview('action-plan');
    actionPlan.generatePlan();
  }, [setInsuranceSubview, actionPlan]);

  // Show subview toggle only after analysis is complete
  const showSubviewToggle = isComplete;

  return (
    <AnimatePresence mode="wait">
      <div className="space-y-6">
        {/* Header with subview toggle */}
        <MotionDiv
          {...fadeInUp}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">
              {insuranceSubview === 'action-plan' ? 'Coverage Action Plan' : 'Insurance Analyzer'}
            </h2>
            <p className="text-sm font-light text-text-secondary mt-1.5">
              {insuranceSubview === 'action-plan'
                ? 'Source-backed coverage improvement recommendations'
                : 'Upload your policy to find coverage gaps'}
            </p>
          </div>

          {/* Subview toggle pills */}
          {showSubviewToggle && (
            <div className="surface-panel rounded-2xl p-1.5 flex gap-1">
              {SUBVIEWS.map((view) => {
                const Icon = view.icon;
                const isActive = insuranceSubview === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setInsuranceSubview(view.id)}
                    className={`
                      flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {view.label}
                  </button>
                );
              })}
            </div>
          )}
        </MotionDiv>

        {/* Analysis View */}
        {insuranceSubview === 'analysis' && (
          <>
            <MotionDiv
              {...fadeInUp}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex-1">
                <PolicyUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} isComplete={isComplete} />
              </div>
              {!isComplete && !isAnalyzing && (
                <button onClick={handleLoadDemo}
                  className="px-4 py-2 text-sm font-normal bg-primary text-white rounded-lg hover:bg-primary/90 transition whitespace-nowrap">
                  Load Demo Policy
                </button>
              )}
            </MotionDiv>

            {analysisError && (
              <MotionDiv
                {...fadeInUp}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 rounded-xl border border-gap/20 bg-gap/5 p-4 text-sm text-gap"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Insurance analysis failed</p>
                  <p className="mt-1">{analysisError}</p>
                </div>
              </MotionDiv>
            )}

            {/* Action Plan CTA - shown after analysis completion */}
            {isComplete && (
              <MotionDiv
                {...fadeInUp}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="surface-panel rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Ready for coverage planning</p>
                    <p className="text-xs text-text-secondary">Generate a source-backed action plan from your gaps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRunActionPlan}
                  disabled={actionPlan.isGenerating}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionPlan.isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : actionPlan.hasPlan ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Refresh Action Plan
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Run Action Plan Setup
                    </>
                  )}
                </button>
              </MotionDiv>
            )}

            <AnimatePresence>
              {policySummary && (
                <MotionDiv
                  key="policy-summary"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <PolicySummary summary={policySummary} />
                </MotionDiv>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {gapAnalysis && (
                <MotionDiv
                  key="gap-analysis"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <GapAnalysis gaps={gapAnalysis} />
                </MotionDiv>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Action Plan View */}
        {insuranceSubview === 'action-plan' && (
          <ActionPlanContent actionPlan={actionPlan} financialMetrics={financialMetrics} />
        )}
      </div>
    </AnimatePresence>
  );
}

/**
 * Embedded Action Plan content - reuses data from useCoverageActionPlan hook
 */
function ActionPlanContent({ actionPlan, financialMetrics }) {
  const {
    isLoading,
    isGenerating,
    planError,
    currentScore,
    projectedScore,
    currentGrade,
    projectedGrade,
    dashOffset,
    topRisks,
    planItems,
    unsupportedCount,
    actionCount,
    latestGapAnalysis,
    latestPlan,
    getGradeDescription,
    getScoreTone,
    CIRCUMFERENCE,
  } = actionPlan;

  if (!latestGapAnalysis && !isLoading) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center">
        <p className="text-base font-light text-text-secondary">
          Complete your insurance analysis first to generate a source-backed coverage improvement plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {planError && (
        <div className="rounded-2xl border border-gap/20 bg-gap/5 p-4 text-sm text-gap">
          {planError}
        </div>
      )}

      {(isLoading || isGenerating || unsupportedCount > 0) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            {isLoading && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading your latest insurance plan context.
              </>
            )}
            {!isLoading && isGenerating && (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                Generating a refreshed source-backed action plan from your saved gaps.
              </>
            )}
            {!isLoading && !isGenerating && unsupportedCount > 0 && (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                {unsupportedCount} action {unsupportedCount === 1 ? 'still needs' : 'still need'} agent review because carrier-specific fit is not fully confirmed.
              </>
            )}
          </div>
        </div>
      )}

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

      {planItems.length > 0 && (
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
      )}

      {planItems.length === 0 && !isLoading && !isGenerating && (
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
