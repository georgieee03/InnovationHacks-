import { useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ClipboardCheck, FileSearch } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { api } from '../../services/apiClient';
import { analyzeGaps, computeProtectionScore } from '../../services/gapAnalyzer';
import localRecommendations from '../../data/coverageRecommendations.json';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';
import ActionPlan from '../actionplan/ActionPlan';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
const MotionDiv = motion.div;

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
  const [isComplete, setIsComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const resetAnalysis = useCallback(() => {
    setIsComplete(false);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);
    setInsuranceSubview('analysis');
  }, [setGapAnalysis, setInsuranceSubview, setPolicySummary]);

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
    setInsuranceSubview('analysis');
  }, [businessInfo, financialMetrics, riskFactors, setGapAnalysis, setInsuranceSubview, setPolicySummary]);

  const handleFileSelect = useCallback(async (file) => {
    setIsAnalyzing(true);
    resetAnalysis();

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
  }, [completeAnalysis, ensureBusinessRecord, resetAnalysis]);

  const handleLoadDemo = useCallback(async () => {
    setIsAnalyzing(true);
    resetAnalysis();

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
  }, [completeAnalysis, resetAnalysis]);

  const hasAnalysis = Boolean(policySummary || (Array.isArray(gapAnalysis) && gapAnalysis.length));
  const canViewActionPlan = Boolean(Array.isArray(gapAnalysis) && gapAnalysis.length);

  return (
    <AnimatePresence mode="wait">
      <div className="space-y-6">
        <MotionDiv
          {...fadeInUp}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Insurance Analyzer</h2>
          <p className="text-sm font-light text-text-secondary mt-1.5">Upload your policy to find coverage gaps</p>
        </MotionDiv>

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

        {hasAnalysis ? (
          <MotionDiv
            {...fadeInUp}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="glass-card flex flex-col gap-4 rounded-[28px] p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Insurance workspace</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Review the full policy analysis, then switch into the source-backed action plan without leaving this tab.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setInsuranceSubview('analysis')}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors ${
                    insuranceSubview === 'analysis'
                      ? 'bg-white/[0.08] text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FileSearch className="h-4 w-4" />
                  Analysis
                </button>
                <button
                  type="button"
                  onClick={() => canViewActionPlan && setInsuranceSubview('action-plan')}
                  disabled={!canViewActionPlan}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors ${
                    insuranceSubview === 'action-plan'
                      ? 'bg-white/[0.08] text-text-primary'
                      : 'text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:text-text-secondary/40'
                  }`}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Action plan
                </button>
              </div>

              {insuranceSubview === 'analysis' ? (
                <button
                  type="button"
                  onClick={() => setInsuranceSubview('action-plan')}
                  disabled={!canViewActionPlan}
                  className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Run action plan setup
                </button>
              ) : null}
            </div>
          </MotionDiv>
        ) : null}

        <AnimatePresence mode="wait">
          {insuranceSubview === 'action-plan' && canViewActionPlan ? (
            <MotionDiv
              key="insurance-action-plan"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <ActionPlan embedded onBackToAnalysis={() => setInsuranceSubview('analysis')} />
            </MotionDiv>
          ) : (
            <MotionDiv
              key="insurance-analysis"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <AnimatePresence>
                {policySummary ? (
                  <MotionDiv
                    key="policy-summary"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <PolicySummary summary={policySummary} />
                  </MotionDiv>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {gapAnalysis ? (
                  <MotionDiv
                    key="gap-analysis"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <GapAnalysis gaps={gapAnalysis} />
                  </MotionDiv>
                ) : null}
              </AnimatePresence>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
