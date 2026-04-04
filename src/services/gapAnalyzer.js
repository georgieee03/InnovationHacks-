import coverageRecommendations from '../data/coverageRecommendations.json';

export function analyzeGaps(policySummary, businessType, riskFactors) {
  const recommendations = coverageRecommendations[businessType]?.recommendedPolicies || [];
  if (!policySummary) return [];

  const coveredTypes = (policySummary.coverages || []).map(c => c.type.toLowerCase());
  const exclusions = (policySummary.exclusions || []).map(e => e.toLowerCase());

  return recommendations.map((rec) => {
    // Check if location-dependent and risk factor not present
    if (rec.locationDependent && rec.triggerRiskFactors) {
      const hasRisk = rec.triggerRiskFactors.some(rf => riskFactors?.risks?.[rf]);
      if (!hasRisk) {
        return { ...rec, status: 'not-applicable', statusLabel: 'Low Risk for Location' };
      }
    }

    const nameLC = rec.name.toLowerCase();
    const idLC = rec.id.toLowerCase();

    // Check if covered
    const isCovered = coveredTypes.some(ct =>
      ct.includes(idLC.replace(/_/g, ' ')) ||
      ct.includes(nameLC) ||
      nameLC.includes(ct)
    );

    if (isCovered) {
      // Check if underinsured (e.g., general liability at $500K vs recommended $1M)
      const coverage = policySummary.coverages.find(c =>
        c.type.toLowerCase().includes(idLC.replace(/_/g, ' ')) ||
        c.type.toLowerCase().includes(nameLC) ||
        nameLC.includes(c.type.toLowerCase())
      );

      if (coverage) {
        const limitNum = parseFloat((coverage.limit || '').replace(/[^0-9.]/g, ''));
        const recLimitStr = rec.recommendedLimit || '';
        const recLimitNum = parseFloat(recLimitStr.replace(/[^0-9.]/g, ''));

        if (limitNum && recLimitNum && limitNum < recLimitNum) {
          return {
            ...rec, status: 'underinsured', statusLabel: 'Underinsured',
            currentLimit: coverage.limit, currentDeductible: coverage.deductible,
          };
        }
      }

      return {
        ...rec, status: 'covered', statusLabel: 'Covered',
        currentLimit: coverage?.limit, currentDeductible: coverage?.deductible,
      };
    }

    // Check if explicitly excluded
    const isExcluded = exclusions.some(ex =>
      ex.includes(idLC.replace(/_/g, ' ')) ||
      ex.includes(nameLC) ||
      nameLC.includes(ex.split('/')[0].trim())
    );

    if (isExcluded) {
      return { ...rec, status: 'gap', statusLabel: 'Not Covered — Excluded' };
    }

    return { ...rec, status: 'gap', statusLabel: 'Not Covered' };
  });
}

export function computeProtectionScore(gapResults) {
  if (!gapResults || gapResults.length === 0) return 0;
  const total = gapResults.filter(g => g.status !== 'not-applicable').length;
  if (total === 0) return 100;
  const covered = gapResults.filter(g => g.status === 'covered').length;
  const underinsured = gapResults.filter(g => g.status === 'underinsured').length;
  const score = ((covered + (underinsured * 0.5)) / total) * 100;
  return Math.round(score);
}

export function getProtectionGrade(score) {
  if (score >= 90) return { grade: 'A', color: '#10b981', label: 'Excellent' };
  if (score >= 80) return { grade: 'B', color: '#10b981', label: 'Good' };
  if (score >= 70) return { grade: 'C', color: '#f59e0b', label: 'Fair' };
  if (score >= 60) return { grade: 'D', color: '#f59e0b', label: 'Poor' };
  return { grade: 'F', color: '#ef4444', label: 'Critical' };
}
