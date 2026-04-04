const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export const api = {
  createBusiness: (data) => fetchAPI('/business', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBusiness: (id) => fetchAPI(`/business${id ? `?id=${encodeURIComponent(id)}` : ''}`),
  getTransactions: (businessId) => fetchAPI(`/transactions?businessId=${encodeURIComponent(businessId)}`),
  getRiskFactors: (zip) => fetchAPI(`/risk-factors?zip=${encodeURIComponent(zip)}`),
  getRecommendations: (businessType) => fetchAPI(`/recommendations?businessType=${encodeURIComponent(businessType)}`),
  getBusinessTypes: () => fetchAPI('/business-types'),
  analyzePolicy: (policyText, businessId) => fetchAPI('/analyze-policy', {
    method: 'POST',
    body: JSON.stringify({ policyText, businessId }),
  }),
  saveGapAnalysis: (data) => fetchAPI('/save-gap-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
