function normalizeRecommendation(rec) {
  return {
    id: rec.id,
    name: rec.name,
    description: rec.description,
    recommendedLimit: rec.recommendedLimit ?? rec.recommended_limit ?? 'Varies by provider',
    estimatedAnnualPremium: rec.estimatedAnnualPremium ?? {
      low: rec.estimated_premium_low ?? null,
      high: rec.estimated_premium_high ?? null,
    },
    priority: rec.priority ?? 'recommended',
    whyItMatters: rec.whyItMatters ?? rec.why_it_matters ?? '',
    locationDependent: Boolean(rec.locationDependent ?? rec.location_dependent),
    triggerRiskFactors: rec.triggerRiskFactors ?? rec.trigger_risk_factors ?? [],
  };
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLimitNumber(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return null;
  }

  const match = String(value).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function findCoverage(policySummary, recommendation) {
  const coverages = policySummary?.coverages ?? [];
  const recommendationId = normalizeText(recommendation.id);
  const recommendationName = normalizeText(recommendation.name);

  return coverages.find((coverage) => {
    const coverageType = normalizeText(coverage.type);
    const coverageName = normalizeText(coverage.name);

    return (
      coverageType === recommendationId ||
      coverageName === recommendationId ||
      coverageType.includes(recommendationName) ||
      coverageName.includes(recommendationName) ||
      recommendationName.includes(coverageType) ||
      recommendationId === coverageType.replace(/ /g, '_')
    );
  });
}

function isExcluded(policySummary, recommendation) {
  const exclusions = (policySummary?.exclusions ?? []).map(normalizeText);
  const recommendationId = normalizeText(recommendation.id);
  const recommendationName = normalizeText(recommendation.name);

  return exclusions.some((exclusion) => (
    exclusion.includes(recommendationId) ||
    exclusion.includes(recommendationName) ||
    recommendationName.includes(exclusion)
  ));
}

export function analyzeGaps(policySummary, recommendations, riskFactors, financialMetrics) {
  if (!policySummary) {
    return [];
  }

  const riskKeys = Object.keys(riskFactors?.risks ?? {});
  const normalizedRecommendations = (recommendations ?? []).map(normalizeRecommendation);

  return normalizedRecommendations.map((recommendation) => {
    if (recommendation.locationDependent && recommendation.triggerRiskFactors.length > 0) {
      const hasRelevantRisk = recommendation.triggerRiskFactors.some((riskKey) => riskKeys.includes(riskKey));

      if (!hasRelevantRisk) {
        return {
          ...recommendation,
          status: 'not-applicable',
          statusLabel: 'Low Risk for Location',
        };
      }
    }

    const currentCoverage = findCoverage(policySummary, recommendation);

    if (currentCoverage?.covered === false) {
      return {
        ...recommendation,
        status: 'gap',
        statusLabel: 'Not Covered',
        coverageNotes: currentCoverage.notes,
      };
    }

    if (currentCoverage?.covered !== false && currentCoverage) {
      const currentLimit = currentCoverage.limit;
      const recommendedLimit = recommendation.recommendedLimit;
      const currentLimitValue = extractLimitNumber(currentLimit);
      const recommendedLimitValue = extractLimitNumber(recommendedLimit);

      if (currentLimitValue && recommendedLimitValue && currentLimitValue < recommendedLimitValue) {
        return {
          ...recommendation,
          status: 'underinsured',
          statusLabel: 'Underinsured',
          currentLimit,
          currentDeductible: currentCoverage.deductible,
          coverageNotes: currentCoverage.notes,
        };
      }

      return {
        ...recommendation,
        status: 'covered',
        statusLabel: 'Covered',
        currentLimit,
        currentDeductible: currentCoverage.deductible,
        coverageNotes: currentCoverage.notes,
      };
    }

    if (isExcluded(policySummary, recommendation)) {
      return {
        ...recommendation,
        status: 'gap',
        statusLabel: 'Not Covered - Excluded',
      };
    }

    return {
      ...recommendation,
      status: 'gap',
      statusLabel: 'Not Covered',
      urgencyNote:
        financialMetrics?.monthsOfRunway < 3 && recommendation.priority === 'critical'
          ? 'Low reserves increase the urgency of this gap.'
          : null,
    };
  });
}

export function computeProtectionScore(results, financialMetrics) {
  let score = 100;

  for (const result of results ?? []) {
    if (result.status === 'gap') {
      score -= result.priority === 'critical' ? 20 : result.priority === 'recommended' ? 10 : 5;
    }

    if (result.status === 'underinsured') {
      score -= result.priority === 'critical' ? 12 : result.priority === 'recommended' ? 6 : 3;
    }
  }

  if (financialMetrics?.monthsOfRunway < 3) {
    score -= 10;
  } else if (financialMetrics?.monthsOfRunway < 6) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getProtectionGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
