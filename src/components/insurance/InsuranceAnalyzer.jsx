import { useCallback, useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { extractTextFromPDF } from '../../services/pdfParser';
import { analyzePolicyWithLLM } from '../../services/llmService';
import { api } from '../../services/apiClient';
import { analyzeGaps, computeProtectionScore } from '../../services/gapAnalyzer';
import localRecommendations from '../../data/coverageRecommendations.json';
import PolicyUpload from './PolicyUpload';
import PolicySummary from './PolicySummary';
import GapAnalysis from './GapAnalysis';

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

  const handleFileSelect = useCallback(async (file) => {
    setIsAnalyzing(true);
    setIsComplete(false);

    try {
      const policyText = await extractTextFromPDF(file);
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
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [businessInfo, financialMetrics, riskFactors, setGapAnalysis, setPolicySummary]);

  const handleLoadDemo = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/demo-policies/marias-bakery-policy.pdf');
      const blob = await response.blob();
      const file = new File([blob], 'marias-bakery-policy.pdf', { type: 'application/pdf' });
      await handleFileSelect(file);
    } catch (error) {
      console.error('Demo load failed:', error);
      setIsAnalyzing(false);
    }
  }, [handleFileSelect]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Insurance Analyzer</h2>
        <p className="mt-1 text-text-secondary">Upload your policy to find coverage gaps.</p>
      </div>

      <div className="flex items-center gap-4">
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
      </div>

      {policySummary && <PolicySummary summary={policySummary} />}
      {gapAnalysis && <GapAnalysis gaps={gapAnalysis} />}
    </div>
  );
}
