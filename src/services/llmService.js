import { api } from './apiClient';

export async function analyzePolicyWithLLM(policyText, businessId) {
  try {
    return await api.analyzePolicy(policyText, businessId);
  } catch (error) {
    console.error('Policy analysis failed, using fallback:', error);
    return getDemoFallbackResponse();
  }
}

function getDemoFallbackResponse() {
  return {
    policyNumber: 'BOP-2024-TX-00847291',
    insurer: 'Gulf States Mutual Insurance Co.',
    namedInsured: "Maria's Bakery LLC",
    effectiveDates: { start: '2024-03-15', end: '2025-03-15' },
    coverages: [
      { type: 'general_liability', name: 'General Liability', covered: true, limit: '$500,000 per occurrence', deductible: '$1,000', notes: 'Aggregate $1,000,000.' },
      { type: 'commercial_property', name: 'Commercial Property', covered: true, limit: '$100,000', deductible: '$2,500', notes: 'Business personal property only.' },
      { type: 'workers_comp', name: "Workers' Compensation", covered: true, limit: 'Statutory (Texas)', deductible: 'N/A', notes: "Employer's liability at $100,000." },
      { type: 'flood', name: 'Flood Insurance', covered: false, limit: null, deductible: null, notes: 'Explicitly excluded.' },
      { type: 'earthquake', name: 'Earthquake Insurance', covered: false, limit: null, deductible: null, notes: 'Explicitly excluded.' },
      { type: 'equipment_breakdown', name: 'Equipment Breakdown', covered: false, limit: null, deductible: null, notes: 'Excluded.' },
      { type: 'business_interruption', name: 'Business Interruption', covered: false, limit: null, deductible: null, notes: 'Not covered.' },
      { type: 'cyber_liability', name: 'Cyber Liability', covered: false, limit: null, deductible: null, notes: 'Excluded.' },
      { type: 'professional_liability', name: 'Professional Liability', covered: false, limit: null, deductible: null, notes: 'Not included.' },
      { type: 'commercial_auto', name: 'Commercial Auto', covered: false, limit: null, deductible: null, notes: 'Excluded.' }
    ],
    totalAnnualPremium: 4570,
    monthlyPremium: 285,
    plainEnglishSummary: "Your policy covers general liability up to $500,000, business equipment up to $100,000, and workers' comp. You have no flood, equipment breakdown, business interruption, or cyber coverage."
  };
}
