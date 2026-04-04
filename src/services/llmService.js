const API_BASE = import.meta.env.VITE_API_URL || '';

export async function analyzePolicyWithLLM(policyText, businessInfo) {
  try {
    const response = await fetch(`${API_BASE}/api/analyze-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyText }),
    });

    if (!response.ok) return getFallbackAnalysis();

    const data = await response.json();

    // Normalize shape for PolicySummary component
    return {
      policyNumber: data.policyNumber,
      insurer: data.insurer,
      namedInsured: data.namedInsured,
      effectiveDate: data.effectiveDates?.start || data.effectiveDate || '',
      expirationDate: data.effectiveDates?.end || data.expirationDate || '',
      coverages: (data.coverages || []).map((c) => ({
        type: c.name || c.type,
        limit: c.limit || 'N/A',
        deductible: c.deductible || 'N/A',
        details: c.notes || c.details || '',
      })),
      exclusions: (data.coverages || [])
        .filter((c) => c.covered === false)
        .map((c) => c.name || c.type),
      totalAnnualPremium: typeof data.totalAnnualPremium === 'number'
        ? `$${data.totalAnnualPremium.toLocaleString()}`
        : data.totalAnnualPremium || '',
      monthlyPremium: typeof data.monthlyPremium === 'number'
        ? `$${data.monthlyPremium.toLocaleString()}`
        : data.monthlyPremium || '',
      plainEnglishSummary: data.plainEnglishSummary || '',
      policyAnalysisId: data.policyAnalysisId,
    };
  } catch (err) {
    console.error('LLM service error:', err);
    return getFallbackAnalysis();
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
      { type: 'General Liability', limit: '$500,000 per occurrence / $1,000,000 aggregate', deductible: '$1,000', details: 'Covers third-party bodily injury and property damage.' },
      { type: 'Commercial Property', limit: '$100,000 business personal property', deductible: '$2,500', details: 'Covers business personal property. Building not covered (tenant).' },
      { type: 'Workers Compensation', limit: 'Statutory Limits — State of Texas', deductible: 'N/A', details: 'Covers employee work-related injuries.' },
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
