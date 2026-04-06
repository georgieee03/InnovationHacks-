/**
 * Business Intelligence Graph ΓÇö client-side service layer.
 * Mirrors business.graph.ts from the Next.js version.
 * All calls go through /api/data/businesses/:businessId/...
 */

import { API_BASE } from './apiClient.js';

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const base = (businessId) => `/data/businesses/${encodeURIComponent(businessId)}`;

// ΓöÇΓöÇΓöÇ Business ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const createBusiness = (userId, data) =>
  apiFetch('/data/businesses', { method: 'POST', body: JSON.stringify({ userId, ...data }) })
    .then(r => r.id);

export const getBusiness = (businessId) =>
  apiFetch(`${base(businessId)}`);

export const updateBusiness = (businessId, data) =>
  apiFetch(`${base(businessId)}`, { method: 'PATCH', body: JSON.stringify(data) });

export const getBusinessByUserId = (userId) =>
  apiFetch(`/data/businesses?userId=${encodeURIComponent(userId)}`);

// ΓöÇΓöÇΓöÇ Contracts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getContracts = (businessId) =>
  apiFetch(`${base(businessId)}/contracts`);

export const getContract = (businessId, contractId) =>
  apiFetch(`${base(businessId)}/contracts/${contractId}`);

export const addContract = (businessId, contract) =>
  apiFetch(`${base(businessId)}/contracts`, { method: 'POST', body: JSON.stringify(contract) })
    .then(r => r.id);

export const updateContract = (businessId, contractId, data) =>
  apiFetch(`${base(businessId)}/contracts/${contractId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const updateContractObligations = (businessId, contractId, obligations) =>
  updateContract(businessId, contractId, { obligations });

export const deleteContract = (businessId, contractId) =>
  apiFetch(`${base(businessId)}/contracts/${contractId}`, { method: 'DELETE' });

// ΓöÇΓöÇΓöÇ Receipts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getReceipts = (businessId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  const qs = params.toString();
  return apiFetch(`${base(businessId)}/receipts${qs ? `?${qs}` : ''}`);
};

export const addReceipt = (businessId, receipt) =>
  apiFetch(`${base(businessId)}/receipts`, { method: 'POST', body: JSON.stringify(receipt) })
    .then(r => r.id);

export const updateReceipt = (businessId, receiptId, data) =>
  apiFetch(`${base(businessId)}/receipts/${receiptId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteReceipt = (businessId, receiptId) =>
  apiFetch(`${base(businessId)}/receipts/${receiptId}`, { method: 'DELETE' });

// ΓöÇΓöÇΓöÇ Quotes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getQuotes = (businessId, statusFilter) => {
  const qs = statusFilter ? `?status=${statusFilter}` : '';
  return apiFetch(`${base(businessId)}/quotes${qs}`);
};

export const addQuote = (businessId, quote) =>
  apiFetch(`${base(businessId)}/quotes`, { method: 'POST', body: JSON.stringify(quote) })
    .then(r => r.id);

export const updateQuote = (businessId, quoteId, data) =>
  apiFetch(`${base(businessId)}/quotes/${quoteId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteQuote = (businessId, quoteId) =>
  apiFetch(`${base(businessId)}/quotes/${quoteId}`, { method: 'DELETE' });

// ΓöÇΓöÇΓöÇ Compliance ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getComplianceItems = (businessId) =>
  apiFetch(`${base(businessId)}/compliance`);

export const addComplianceItem = (businessId, item) =>
  apiFetch(`${base(businessId)}/compliance`, { method: 'POST', body: JSON.stringify(item) })
    .then(r => r.id);

export const updateComplianceItem = (businessId, itemId, data) =>
  apiFetch(`${base(businessId)}/compliance/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteComplianceItem = (businessId, itemId) =>
  apiFetch(`${base(businessId)}/compliance/${itemId}`, { method: 'DELETE' });

// ΓöÇΓöÇΓöÇ Funding ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getFundingOpportunities = (businessId) =>
  apiFetch(`${base(businessId)}/funding`);

export const addFundingOpportunity = (businessId, opportunity) =>
  apiFetch(`${base(businessId)}/funding`, { method: 'POST', body: JSON.stringify(opportunity) })
    .then(r => r.id);

export const updateFundingOpportunity = (businessId, opportunityId, data) =>
  apiFetch(`${base(businessId)}/funding/${opportunityId}`, { method: 'PATCH', body: JSON.stringify(data) });

// ΓöÇΓöÇΓöÇ Bank / Plaid ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getBankTransactions = (businessId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  const qs = params.toString();
  return apiFetch(`${base(businessId)}/bank-transactions${qs ? `?${qs}` : ''}`);
};

export const getPlaidConnections = (businessId) =>
  apiFetch(`${base(businessId)}/plaid-connections`);

// ΓöÇΓöÇΓöÇ Growth Actions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getGrowthActions = (businessId) =>
  apiFetch(`${base(businessId)}/growth-actions`);

export const dismissGrowthAction = (businessId, actionId) =>
  apiFetch(`${base(businessId)}/growth-actions/${actionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ dismissed: true }),
  });

// ΓöÇΓöÇΓöÇ Files ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export const getUploadedFiles = (businessId) =>
  apiFetch(`${base(businessId)}/files`);

/**
 * Upload a file to blob storage via the data API.
 * Returns { id, blobUrl, fileName, mimeType, folder }
 */
export const uploadBusinessFile = (businessId, folder, file) => {
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('file', file);
  return apiFetch(`${base(businessId)}/files/upload`, { method: 'POST', body: formData });
};
