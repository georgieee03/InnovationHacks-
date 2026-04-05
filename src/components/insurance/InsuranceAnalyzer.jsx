import { useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { api } from '../../services/apiClient';
import { analyzeGaps, computeProtectionScore } from '../../services/gapAnalyzer';
import localRecommendations from '../../data/coverageRecommendations.json';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';

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
  } = useContext(AppContext);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const resetAnalysis = useCallback(() => {
    setIsComplete(false);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);
  }, [setGapAnalysis, setPolicySummary]);

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
      </div>
    </AnimatePresence>
  );
}
