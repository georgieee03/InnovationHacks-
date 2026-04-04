import { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { analyzeGaps } from '../../services/gapAnalyzer';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Insurance Analyzer</h2>
        <p className="text-text-secondary mt-1">Upload your policy to find coverage gaps</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PolicyUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} isComplete={isComplete} />
        </div>
        {!isComplete && !isAnalyzing && (
          <button onClick={handleLoadDemo}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition whitespace-nowrap">
            Load Demo Policy
          </button>
        )}
      </div>

      {policySummary && <PolicySummary summary={policySummary} />}
      {gapAnalysis && <GapAnalysis gaps={gapAnalysis} />}
    </div>
  );
}
