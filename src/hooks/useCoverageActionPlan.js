import { useContext, useEffect, useMemo, useCallback, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { api } from '../services/apiClient';
import { computeProtectionScore, getProtectionGrade } from '../services/gapAnalyzer';

const CIRCUMFERENCE = 2 * Math.PI * 90;

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

/**
 * Hook that manages coverage action plan data loading and generation.
 * Used by both the embedded Insurance view and any standalone usage.
 * 
 * @param {Object} options
 * @param {boolean} options.autoLoad - Whether to automatically load on mount (default: true)
 * @returns {Object} Action plan state and helpers
 */
export default function useCoverageActionPlan(options = {}) {
  const { autoLoad = true } = options;
  const {
    businessInfo,
    gapAnalysis,
    financialMetrics,
    riskFactors,
  } = useContext(AppContext);

  const [envelope, setEnvelope] = useState(null);
  const [planError, setPlanError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasRequestedPlan, setHasRequestedPlan] = useState(false);

  const refreshKey = useMemo(() => JSON.stringify({
    businessId: businessInfo?.id || null,
    gapFingerprint: Array.isArray(gapAnalysis)
      ? gapAnalysis.map((item) => `${item.id}:${item.status}:${item.priority}`).join('|')
      : 'none',
    margin: Number(financialMetrics?.averageMonthlyIncome || 0) - Number(financialMetrics?.averageMonthlyExpenses || 0),
    reserves: Number(financialMetrics?.currentReserves || 0),
    riskZip: riskFactors?.zip || null,
  }), [businessInfo?.id, gapAnalysis, financialMetrics, riskFactors?.zip]);

  const loadPlan = useCallback(async () => {
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

      setEnvelope(normalizeEnvelope(generated, gapAnalysis, financialMetrics));
    } catch (error) {
      setPlanError(error.message || 'Failed to load the insurance action plan.');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [businessInfo?.id, financialMetrics, gapAnalysis, riskFactors]);

  const generatePlan = useCallback(async () => {
    if (!businessInfo?.id) {
      setPlanError('Business profile required to generate action plan.');
      return;
    }

    if (!gapAnalysis || gapAnalysis.length === 0) {
      setPlanError('Complete an insurance analysis first.');
      return;
    }

    setHasRequestedPlan(true);
    setPlanError('');
    setIsGenerating(true);

    try {
      const generated = await api.generateCoverageActionPlan({
        businessId: businessInfo.id,
        financialMetrics,
        riskFactors,
      });

      setEnvelope(normalizeEnvelope(generated, gapAnalysis, financialMetrics));
    } catch (error) {
      setPlanError(error.message || 'Failed to generate the action plan.');
    } finally {
      setIsGenerating(false);
    }
  }, [businessInfo?.id, financialMetrics, gapAnalysis, riskFactors]);

  const resetPlan = useCallback(() => {
    setEnvelope(null);
    setPlanError('');
    setHasRequestedPlan(false);
  }, []);

  // Auto-load plan data on mount if enabled
  useEffect(() => {
    if (!autoLoad) return;

    let active = true;

    async function autoLoadPlan() {
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

        if (!active) return;

        setEnvelope(loaded);
        setIsLoading(false);

        if (!loaded?.latestGapAnalysis) return;
        if (loaded.latestPlan && !loaded.stale) return;

        setIsGenerating(true);

        const generated = await api.generateCoverageActionPlan({
          businessId: businessInfo.id,
          financialMetrics,
          riskFactors,
        });

        if (!active) return;

        setEnvelope(normalizeEnvelope(generated, gapAnalysis, financialMetrics));
      } catch (error) {
        if (!active) return;
        setPlanError(error.message || 'Failed to load the insurance action plan.');
      } finally {
        if (active) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    }

    void autoLoadPlan();

    return () => {
      active = false;
    };
  }, [autoLoad, businessInfo?.id, refreshKey, financialMetrics, gapAnalysis, riskFactors]);

  // Derived values
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
  const hasPlan = Boolean(latestPlan || hasRequestedPlan);
  const hasGapAnalysis = Boolean(latestGapAnalysis);

  return {
    // State
    envelope,
    planError,
    isLoading,
    isGenerating,
    hasRequestedPlan,
    
    // Derived values
    latestGapAnalysis,
    latestPlan,
    currentScore,
    projectedScore,
    currentGrade,
    projectedGrade,
    dashOffset,
    topRisks,
    planItems,
    unsupportedCount,
    actionCount,
    hasPlan,
    hasGapAnalysis,
    
    // Actions
    loadPlan,
    generatePlan,
    resetPlan,
    
    // Helpers
    getGradeDescription,
    getScoreTone,
    CIRCUMFERENCE,
  };
}
