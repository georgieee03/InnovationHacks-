import { useCallback, useContext, useState } from 'react';
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

export default function InsuranceAnalyzer() {
  const {
    businessInfo,
    riskFactors,
    financialMetrics,
    policySummary,
    setPolicySummary,
    gapAnalysis,
    setGapAnalysis,
  } = useContext(AppContext);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const completeAnalysis = useCallback(async (policyText) => {
    const summary = await analyzePolicyWithLLM(policyText, businessInfo?.id);
    setPolicySummary(summary);

    let recommendations;
    try {
      recommendations = await api.getRecommendations(businessInfo?.type);
    } catch (error) {
      console.warn('Recommendations API failed, using local fallback:', error);
      recommendations = getFallbackRecommendations(businessInfo?.type);
    }

    const gaps = analyzeGaps(summary, recommendations, riskFactors, financialMetrics);
    setGapAnalysis(gaps);

    if (businessInfo?.id) {
      const protectionScore = computeProtectionScore(gaps, financialMetrics);
      api.saveGapAnalysis({
        businessId: businessInfo.id,
        policyAnalysisId: summary.policyAnalysisId ?? null,
        results: gaps,
        protectionScore,
      }).catch((error) => {
        console.warn('Gap analysis save failed:', error);
      });
    }

    setIsComplete(true);
  }, [businessInfo, financialMetrics, riskFactors, setGapAnalysis, setPolicySummary]);

  const handleFileSelect = useCallback(async (file) => {
    setIsAnalyzing(true);
    setIsComplete(false);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);

    try {
      const policyText = await extractTextFromPDF(file);
      await completeAnalysis(policyText);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(error?.message || 'We could not analyze that PDF. Try the demo policy or upload a text-based PDF.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [completeAnalysis, setGapAnalysis, setPolicySummary]);

  const handleLoadDemo = useCallback(async () => {
    setIsAnalyzing(true);
    setIsComplete(false);
    setAnalysisError('');
    setPolicySummary(null);
    setGapAnalysis(null);

    try {
      await completeAnalysis(DEMO_POLICY_TEXT);
    } catch (error) {
      console.error('Demo load failed:', error);
      setAnalysisError(error?.message || 'The demo policy could not be analyzed right now.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [completeAnalysis, setGapAnalysis, setPolicySummary]);

  return (
    <AnimatePresence mode="wait">
      <div className="space-y-6">
        <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Insurance Analyzer</h2>
          <p className="mt-1 text-text-secondary">Upload your policy to find coverage gaps</p>
        </motion.div>

        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="flex-1">
            <PolicyUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} isComplete={isComplete} />
          </div>
          {!isComplete && !isAnalyzing && (
            <button
              onClick={() => void handleLoadDemo()}
              className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary/90"
            >
              Load Demo Policy
            </button>
          )}
        </motion.div>

        {analysisError && (
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 rounded-xl border border-gap/20 bg-gap/5 p-4 text-sm text-gap"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Insurance analysis failed</p>
              <p className="mt-1">{analysisError}</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {policySummary && (
            <motion.div
              key="policy-summary"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PolicySummary summary={policySummary} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gapAnalysis && (
            <motion.div
              key="gap-analysis"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GapAnalysis gaps={gapAnalysis} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
