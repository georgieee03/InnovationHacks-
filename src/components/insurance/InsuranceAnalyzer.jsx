import { useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { analyzeGaps } from '../../services/gapAnalyzer';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function InsuranceAnalyzer() {
  const {
    businessInfo, riskFactors,
    policySummary, setPolicySummary,
    gapAnalysis, setGapAnalysis,
  } = useContext(AppContext);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileSelect = useCallback(async (file) => {
    setIsAnalyzing(true);
    try {
      const policyText = await extractTextFromPDF(file);
      const summary = await analyzePolicyWithLLM(policyText, businessInfo);
      setPolicySummary(summary);

      const gaps = analyzeGaps(summary, businessInfo?.type, riskFactors);
      setGapAnalysis(gaps);
      setIsComplete(true);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [businessInfo, riskFactors, setPolicySummary, setGapAnalysis]);

  const handleLoadDemo = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const resp = await fetch('/demo-policies/marias-bakery-policy.pdf');
      const blob = await resp.blob();
      const file = new File([blob], 'marias-bakery-policy.pdf', { type: 'application/pdf' });
      await handleFileSelect(file);
    } catch (err) {
      console.error('Demo load failed:', err);
      setIsAnalyzing(false);
    }
  }, [handleFileSelect]);

  return (
    <AnimatePresence mode="wait">
      <div className="space-y-6">
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Insurance Analyzer</h2>
          <p className="text-sm font-light text-text-secondary mt-1.5">Upload your policy to find coverage gaps</p>
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
            <button onClick={handleLoadDemo}
              className="px-4 py-2 text-sm font-normal bg-primary text-white rounded-lg hover:bg-primary/90 transition whitespace-nowrap">
              Load Demo Policy
            </button>
          )}
        </motion.div>

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
