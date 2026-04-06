const LOCALHOSTS = new Set(['localhost', '127.0.0.1']);
const CONFIGURED_API_HOST = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || '';

function shouldUseConfiguredApiHost(apiHost) {
  if (!apiHost) {
    return false;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const configuredUrl = new URL(apiHost);
    const pageUrl = new URL(window.location.href);
    const configuredIsLocal = LOCALHOSTS.has(configuredUrl.hostname);
    const pageIsLocal = LOCALHOSTS.has(pageUrl.hostname);

    if (configuredIsLocal && !pageIsLocal) {
      return false;
    }

    if (configuredIsLocal && pageIsLocal) {
      return false;
    }

    if (pageUrl.protocol === 'https:' && configuredUrl.protocol !== 'https:' && !pageIsLocal) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const API_BASE = shouldUseConfiguredApiHost(CONFIGURED_API_HOST) ? `${CONFIGURED_API_HOST}/api` : '/api';

function buildApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

async function parseApiError(response) {
  const error = await response.json().catch(() => ({ error: 'API request failed' }));
  return new Error(error.error || 'API request failed');
}

function shouldPreserveOriginalError(response) {
  const contentType = response.headers.get('content-type') || '';
  return response.status === 404 && !contentType.includes('application/json');
}

async function fetchAPI(endpoint, options = {}) {
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const requestOptions = {
    headers: isFormDataBody
      ? { ...options.headers }
      : {
          'Content-Type': 'application/json',
          ...options.headers,
        },
    credentials: 'same-origin',
    ...options,
  };

  try {
    const response = await fetch(buildApiUrl(endpoint), requestOptions);

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  } catch (error) {
    const shouldRetrySameOrigin = API_BASE !== '/api';

    if (!shouldRetrySameOrigin) {
      throw error instanceof Error ? error : new Error('Failed to fetch');
    }

    const fallbackResponse = await fetch(`/api${endpoint}`, requestOptions).catch(() => null);

    if (!fallbackResponse) {
      throw error instanceof Error ? error : new Error('Failed to fetch');
    }

    if (shouldPreserveOriginalError(fallbackResponse)) {
      throw error instanceof Error ? error : new Error('Failed to fetch');
    }

    if (!fallbackResponse.ok) {
      throw await parseApiError(fallbackResponse);
    }

    return fallbackResponse.json();
  }
}

export const api = {
  getAuthSession: () => fetchAPI('/session'),
  createBusiness: (data) => fetchAPI('/business', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBusiness: (id) => fetchAPI(`/business${id ? `?id=${encodeURIComponent(id)}` : ''}`),
  getTransactions: (businessId) => fetchAPI(`/transactions?businessId=${encodeURIComponent(businessId)}`),
  lookupZip: (zip) => fetchAPI(`/zip-lookup?zip=${encodeURIComponent(zip)}`),
  getRiskFactors: (zip) => fetchAPI(`/risk-factors?zip=${encodeURIComponent(zip)}`),
  getRecommendations: (businessType) => fetchAPI(`/recommendations?businessType=${encodeURIComponent(businessType)}`),
  getBusinessTypes: () => fetchAPI('/business-types'),
  analyzePolicy: (policyText, businessId, options = {}) => fetchAPI('/analyze-policy', {
    method: 'POST',
    body: JSON.stringify({
      policyText,
      businessId,
      uploadedFileId: options.uploadedFileId ?? null,
      allowDemoFallback: Boolean(options.allowDemoFallback),
    }),
  }),
  saveGapAnalysis: (data) => fetchAPI('/save-gap-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCoverageActionPlan: (businessId) => fetchAPI(`/ai/coverage-action-plan?businessId=${encodeURIComponent(businessId)}`),
  generateCoverageActionPlan: (data) => fetchAPI('/ai/generate-coverage-action-plan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createPlaidLinkToken: ({ userId = '', redirectUri = '' } = {}) => fetchAPI('/plaid/create-link-token', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId || null,
      redirect_uri: redirectUri || null,
    }),
  }),
  exchangePlaidToken: ({ publicToken, userId = '', institutionName = null }) => fetchAPI('/plaid/exchange-token', {
    method: 'POST',
    body: JSON.stringify({
      public_token: publicToken,
      user_id: userId || null,
      institution_name: institutionName,
    }),
  }),
  getPlaidAccounts: (userId = '') => fetchAPI(`/plaid/accounts${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`),
  getPlaidTransactions: (userId = '', days = 90) => fetchAPI(
    `/plaid/transactions${userId ? `?user_id=${encodeURIComponent(userId)}&` : '?'}days=${encodeURIComponent(days)}`
  ),
  listContracts: () => fetchAPI('/workspace/contracts'),
  createContract: (data) => fetchAPI('/workspace/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listQuotes: () => fetchAPI('/workspace/quotes'),
  createQuote: (data) => fetchAPI('/workspace/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listReceipts: () => fetchAPI('/workspace/receipts'),
  createReceipt: (data) => fetchAPI('/workspace/receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listCompliance: () => fetchAPI('/workspace/compliance'),
  updateCompliance: (id, data) => fetchAPI(`/workspace/compliance/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getGrowthWorkspace: () => fetchAPI('/workspace/growth'),
  refreshGrowthWorkspace: () => fetchAPI('/workspace/growth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  // AI routes
  businessAdvisor: (answers) => fetchAPI('/ai/business-advisor', {
    method: 'POST',
    body: JSON.stringify(answers),
  }),
  analyzeReceipt: (data) => fetchAPI('/ai/analyze-receipt', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  analyzeTaxes: (data) => fetchAPI('/ai/analyze-taxes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  analyzeContract: (data) => fetchAPI('/ai/analyze-contract', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateQuote: (data) => fetchAPI('/ai/generate-quote', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateContract: (data) => fetchAPI('/ai/generate-contract', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateCompliance: (data) => fetchAPI('/ai/generate-compliance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  scanOpportunities: (data) => fetchAPI('/ai/scan-opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  scanFunding: (data) => fetchAPI('/ai/scan-funding', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  scanTaxOpportunities: (data) => fetchAPI('/ai/scan-tax-opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  uploadWorkspaceFile: (folder, file) => {
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('file', file);

    return fetchAPI('/workspace/files/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export { API_BASE, buildApiUrl };
