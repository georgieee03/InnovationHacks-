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
  const requestOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
  createBusiness: (data) => fetchAPI('/business', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBusiness: (id) => fetchAPI(`/business${id ? `?id=${encodeURIComponent(id)}` : ''}`),
  getTransactions: (businessId) => fetchAPI(`/transactions?businessId=${encodeURIComponent(businessId)}`),
  getRiskFactors: (zip) => fetchAPI(`/risk-factors?zip=${encodeURIComponent(zip)}`),
  getRecommendations: (businessType) => fetchAPI(`/recommendations?businessType=${encodeURIComponent(businessType)}`),
  getBusinessTypes: () => fetchAPI('/business-types'),
  analyzePolicy: (policyText, businessId, options = {}) => fetchAPI('/analyze-policy', {
    method: 'POST',
    body: JSON.stringify({
      policyText,
      businessId,
      allowDemoFallback: Boolean(options.allowDemoFallback),
    }),
  }),
  saveGapAnalysis: (data) => fetchAPI('/save-gap-analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createPlaidLinkToken: ({ userId = 'default-user', redirectUri = '' } = {}) => fetchAPI('/plaid/create-link-token', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      redirect_uri: redirectUri || null,
    }),
  }),
  exchangePlaidToken: ({ publicToken, userId = 'default-user', institutionName = null }) => fetchAPI('/plaid/exchange-token', {
    method: 'POST',
    body: JSON.stringify({
      public_token: publicToken,
      user_id: userId,
      institution_name: institutionName,
    }),
  }),
  getPlaidAccounts: (userId = 'default-user') => fetchAPI(`/plaid/accounts?user_id=${encodeURIComponent(userId)}`),
  getPlaidTransactions: (userId = 'default-user', days = 90) => fetchAPI(
    `/plaid/transactions?user_id=${encodeURIComponent(userId)}&days=${encodeURIComponent(days)}`
  ),
};

export { API_BASE, buildApiUrl };
