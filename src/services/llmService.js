import { api } from './apiClient';

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return value || '';
  }

  return `$${value.toLocaleString()}`;
}

function normalizeCoverage(coverage) {
  return {
    type: coverage.name || coverage.type,
    name: coverage.name || coverage.type,
    covered: coverage.covered,
    limit: coverage.limit || 'N/A',
    deductible: coverage.deductible || 'N/A',
    details: coverage.notes || coverage.details || '',
  };
}

function normalizePolicySummary(data) {
  return {
    policyNumber: data.policyNumber,
    insurer: data.insurer,
    namedInsured: data.namedInsured,
    effectiveDate: data.effectiveDates?.start || data.effectiveDate || '',
    expirationDate: data.effectiveDates?.end || data.expirationDate || '',
    coverages: (data.coverages || []).map(normalizeCoverage),
    exclusions: (data.coverages || [])
      .filter((coverage) => coverage.covered === false)
      .map((coverage) => coverage.name || coverage.type),
    totalAnnualPremium: formatCurrency(data.totalAnnualPremium),
    monthlyPremium: formatCurrency(data.monthlyPremium),
    plainEnglishSummary: data.plainEnglishSummary || '',
    policyAnalysisId: data.policyAnalysisId,
  };
}

export async function analyzePolicyWithLLM(policyText, businessInfo, options = {}) {
  try {
    const response = await api.analyzePolicy(policyText, businessInfo?.id, options);
    return normalizePolicySummary(response);
  } catch (error) {
    console.error('LLM service error:', error);
    if (options.allowDemoFallback) {
      return getFallbackAnalysis();
    }

    throw error;
  }
}

function getFallbackAnalysis() {
  return {
    policyNumber: 'BOP-2024-TX-00847291',
    insurer: 'Gulf States Mutual Insurance Co.',
    effectiveDate: 'March 15, 2024',
    expirationDate: 'March 15, 2025',
    namedInsured: "Maria's Bakery LLC",
    coverages: [
      {
        type: 'General Liability',
        name: 'General Liability',
        covered: true,
        limit: '$500,000 per occurrence / $1,000,000 aggregate',
        deductible: '$1,000',
        details: 'Covers third-party bodily injury and property damage.',
      },
      {
        type: 'Commercial Property',
        name: 'Commercial Property',
        covered: true,
        limit: '$100,000 business personal property',
        deductible: '$2,500',
        details: 'Covers business personal property. Building not covered (tenant).',
      },
      {
        type: 'Workers Compensation',
        name: "Workers' Compensation",
        covered: true,
        limit: 'Statutory Limits - State of Texas',
        deductible: 'N/A',
        details: 'Covers employee work-related injuries.',
      },
    ],
    exclusions: [
      'Flood and surface water damage',
      'Equipment breakdown / mechanical failure',
      'Cyber liability and data breaches',
      'Business interruption / loss of income',
    ],
    totalAnnualPremium: '$4,570.00',
    monthlyPremium: '$285.00',
  };
}
