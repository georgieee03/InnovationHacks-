import { createContext, useCallback, useEffect, useState } from 'react';
import transactionsData from '../data/transactions.json';
import riskFactorsData from '../data/riskFactors.json';
import { computeFinancialMetrics } from '../services/financialCalculator';
import { api } from '../services/apiClient';

export const AppContext = createContext(null);

function getViewportMode(width) {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function normalizeBusiness(data, fallback = {}) {
  return {
    id: data?.id ?? fallback.id,
    name: data?.name ?? fallback.name ?? '',
    type: data?.type ?? fallback.type ?? 'restaurant',
    zip: String(data?.zip ?? fallback.zip ?? ''),
    city: data?.city ?? fallback.city ?? '',
    state: data?.state ?? fallback.state ?? '',
    ownerName: data?.owner_name ?? data?.ownerName ?? fallback.ownerName ?? '',
    ownerEmail: data?.owner_email ?? data?.ownerEmail ?? fallback.ownerEmail ?? '',
    monthlyRevenue: Number(
      data?.monthlyRevenue
      ?? data?.monthlyRevenueEstimate
      ?? data?.monthly_revenue_estimate
      ?? data?.monthly_revenue_avg
      ?? fallback.monthlyRevenue
      ?? fallback.monthlyRevenueEstimate
      ?? 0
    ),
    employees: Number(data?.employees ?? fallback.employees ?? 1),
  };
}

function normalizeRiskFactors(data) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    zip: data.zip ? String(data.zip) : undefined,
    emergencyFundMultiplier: Number(data.emergencyFundMultiplier ?? data.emergency_fund_multiplier ?? 3),
    risks: data.risks ?? {},
  };
}

function normalizeAccount(account) {
  return {
    ...account,
    balance: Number(account.balance ?? 0),
  };
}

function normalizeCategory(rawCategory, type, description = '') {
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const normalized = String(category ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const haystack = `${normalized} ${String(description ?? '').toLowerCase()}`.trim();

  if (type === 'income' || /\b(income|revenue|deposit|sale|sales|interest|refund received|payment received|payout)\b/.test(haystack)) {
    return 'revenue';
  }

  if (/\b(rent|lease|mortgage)\b/.test(haystack)) {
    return 'rent';
  }

  if (/\b(payroll|salary|wage|benefit|employee)\b/.test(haystack)) {
    return 'payroll';
  }

  if (/\b(utilit|energy|electric|electricity|water|gas|internet|telecom|phone|wifi|comcast)\b/.test(haystack)) {
    return 'utilities';
  }

  if (/\b(equipment|repair|maintenance|hardware|machinery|tools|webstaurant|kitchen)\b/.test(haystack)) {
    return 'equipment';
  }

  if (/\b(subscription|software|saas|insurance|advertising|membership|service fee|bank fee|fee)\b/.test(haystack)) {
    return 'subscriptions';
  }

  if (/\b(suppl|inventory|food|grocery|restaurant depot|sysco|amazon business|office depot|merchandise|wholesale)\b/.test(haystack)) {
    return 'supplies';
  }

  if (!normalized) {
    return 'miscellaneous';
  }

  return normalized.replace(/\s+/g, '_');
}

function normalizeTransaction(transaction) {
  const type = transaction.type ?? (Number(transaction.amount ?? 0) >= 0 ? 'income' : 'expense');
  let amount = Number(transaction.amount ?? 0);

  if (type === 'income' && amount < 0) {
    amount = Math.abs(amount);
  }

  if (type === 'expense' && amount > 0) {
    amount = -Math.abs(amount);
  }

  return {
    ...transaction,
    category: normalizeCategory(
      transaction.category ?? transaction.personal_finance_category?.primary,
      type,
      transaction.description ?? transaction.name
    ),
    type,
    amount,
    date: typeof transaction.date === 'string' ? transaction.date.slice(0, 10) : transaction.date,
  };
}

function getLocalAccounts() {
  return transactionsData.accounts.map(normalizeAccount);
}

function getLocalTransactions() {
  return transactionsData.transactions.map(normalizeTransaction);
}

function getLocalRiskFactors(zip) {
  return normalizeRiskFactors(riskFactorsData[String(zip)]) ?? null;
}

function buildLocalSession(formData) {
  const riskFactors = getLocalRiskFactors(formData.zip);
  const business = normalizeBusiness(formData, {
    city: formData.city || riskFactors?.city || '',
    state: formData.state || riskFactors?.state || '',
  });

  return {
    business,
    riskFactors,
    accounts: getLocalAccounts(),
    transactions: getLocalTransactions(),
  };
}

function buildDemoFormData() {
  return {
    name: transactionsData.business.name,
    type: transactionsData.business.type,
    zip: transactionsData.business.zip,
    city: transactionsData.business.city,
    state: transactionsData.business.state,
    monthlyRevenue: Number(transactionsData.business.monthlyRevenueEstimate ?? 0),
    employees: Number(transactionsData.business.employees ?? 1),
  };
}

function buildBusinessPayload(formData, fallback = {}) {
  return {
    name: formData?.name ?? fallback.name ?? '',
    type: formData?.type ?? fallback.type ?? 'restaurant',
    zip: String(formData?.zip ?? fallback.zip ?? ''),
    city: formData?.city ?? fallback.city ?? '',
    state: formData?.state ?? fallback.state ?? '',
    monthlyRevenue: Number(
      formData?.monthlyRevenue
      ?? formData?.monthlyRevenueEstimate
      ?? formData?.monthly_revenue_estimate
      ?? fallback.monthlyRevenue
      ?? fallback.monthlyRevenueEstimate
      ?? fallback.monthly_revenue_estimate
      ?? 0
    ),
    employees: Number(formData?.employees ?? fallback.employees ?? 1),
  };
}

function getBusinessPersistenceErrorMessage(error) {
  if (error?.message && !/failed to fetch/i.test(error.message)) {
    return error.message;
  }

  return 'We could not save your business profile. Please try again to continue.';
}

export function AppProvider({ children }) {
  const initialViewportMode = typeof window === 'undefined' ? 'desktop' : getViewportMode(window.innerWidth);
  const [authReady, setAuthReady] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [loginUrl, setLoginUrl] = useState('/api/login');
  const [logoutUrl, setLogoutUrl] = useState('/api/logout');
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [riskFactors, setRiskFactors] = useState(null);
  const [policySummary, setPolicySummary] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('financial');
  const [viewportMode, setViewportMode] = useState(initialViewportMode);
  const [sidebarExpanded, setSidebarExpanded] = useState(initialViewportMode === 'desktop');
  const [sidebarLocked, setSidebarLocked] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncViewport = () => {
      const nextMode = getViewportMode(window.innerWidth);
      setViewportMode((currentMode) => {
        if (currentMode !== nextMode) {
          if (nextMode === 'desktop') {
            setSidebarExpanded(true);
            setSidebarLocked(false);
          } else {
            setSidebarExpanded(false);
            setSidebarLocked(false);
          }
          setMobileSidebarOpen(false);
        }

        return nextMode;
      });
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const clearWorkspaceState = useCallback(() => {
    setBusinessInfo(null);
    setTransactions([]);
    setAccounts([]);
    setRiskFactors(null);
    setFinancialMetrics(null);
    setPolicySummary(null);
    setGapAnalysis(null);
    setIsOnboarded(false);
    setPlaidConnected(false);
    setActiveTab('financial');
  }, []);

  const applyLoadedState = useCallback((info, nextAccounts, nextTransactions, nextRiskFactors, options = {}) => {
    setBusinessInfo(info);
    setAccounts(nextAccounts);
    setTransactions(nextTransactions);
    setRiskFactors(nextRiskFactors);
    setFinancialMetrics(computeFinancialMetrics(nextTransactions, nextAccounts, nextRiskFactors));

    if (options.resetAnalysis ?? true) {
      setPolicySummary(null);
      setGapAnalysis(null);
    }

    if (options.resetActiveTab ?? true) {
      setActiveTab('financial');
    }

    if (typeof options.plaidConnected === 'boolean') {
      setPlaidConnected(options.plaidConnected);
    }

    if (typeof options.isOnboarded === 'boolean') {
      setIsOnboarded(options.isOnboarded);
    }
  }, []);

  const ensureBusinessRecord = useCallback(async (candidate = businessInfo, options = {}) => {
    const {
      isOnboardedOverride = isOnboarded,
      plaidConnectedOverride = plaidConnected,
    } = options;

    const normalizedCandidate = normalizeBusiness(candidate);
    if (normalizedCandidate?.id) {
      return normalizedCandidate;
    }

    const payload = buildBusinessPayload(candidate, businessInfo || {});
    if (!payload.name || !payload.zip) {
      throw new Error('Complete onboarding before uploading or analyzing insurance documents.');
    }

    const createdBusiness = await api.createBusiness(payload);
    const normalizedBusiness = normalizeBusiness(createdBusiness, normalizedCandidate);

    if (!normalizedBusiness.id) {
      throw new Error('Business profile did not persist correctly. Please try onboarding again.');
    }

    setBusinessInfo(normalizedBusiness);
    setIsOnboarded(isOnboardedOverride);
    setPlaidConnected(plaidConnectedOverride);

    return normalizedBusiness;
  }, [businessInfo, isOnboarded, plaidConnected]);

  const loadBusinessWorkspace = useCallback(async (businessRecord, options = {}) => {
    const normalizedBusiness = normalizeBusiness(businessRecord);
    const localSession = buildLocalSession(normalizedBusiness);

    let remoteRiskFactors = localSession.riskFactors;
    try {
      remoteRiskFactors = normalizeRiskFactors(await api.getRiskFactors(normalizedBusiness.zip)) ?? localSession.riskFactors;
    } catch {
      remoteRiskFactors = localSession.riskFactors;
    }

    // Try loading Plaid data first (auth0_id-scoped), fall back to DB transactions, then local
    let nextAccounts = localSession.accounts;
    let nextTransactions = localSession.transactions;
    let hasPlaid = false;

    try {
      const [plaidAccounts, plaidTransactions] = await Promise.all([
        api.getPlaidAccounts(),
        api.getPlaidTransactions(),
      ]);

      const plaidAccts = (plaidAccounts.accounts || []).map(normalizeAccount);
      const plaidTxns = (plaidTransactions.transactions || []).map(normalizeTransaction);

      if (plaidAccts.length > 0) {
        nextAccounts = plaidAccts;
        nextTransactions = plaidTxns;
        hasPlaid = true;
      }
    } catch {
      // Plaid not connected or failed — try DB transactions
    }

    if (!hasPlaid) {
      try {
        const remoteBundle = await api.getTransactions(normalizedBusiness.id);
        if (remoteBundle.accounts?.length) {
          nextAccounts = remoteBundle.accounts.map(normalizeAccount);
        }
        if (remoteBundle.transactions?.length) {
          nextTransactions = remoteBundle.transactions.map(normalizeTransaction);
        }
      } catch {
        // Use local fallback
      }
    }

    applyLoadedState(normalizedBusiness, nextAccounts, nextTransactions, remoteRiskFactors, {
      isOnboarded: true,
      plaidConnected: hasPlaid,
      ...options,
    });
  }, [applyLoadedState]);

  const hydrateBusinessSession = useCallback(async (formData, options = {}) => {
    const { markOnboarded = true } = options;
    setLoading(true);

    const localSession = buildLocalSession(formData);
    applyLoadedState(localSession.business, localSession.accounts, localSession.transactions, localSession.riskFactors, {
      isOnboarded: markOnboarded,
      plaidConnected: false,
    });

    try {
      const createdBusiness = await ensureBusinessRecord(buildBusinessPayload(formData), {
        isOnboardedOverride: markOnboarded,
        plaidConnectedOverride: false,
      });

      await loadBusinessWorkspace(createdBusiness, {
        isOnboarded: markOnboarded,
        plaidConnected: false,
      });

      return {
        business: normalizeBusiness(createdBusiness),
        riskFactors: localSession.riskFactors,
      };
    } catch (error) {
      console.error('Onboarding business persistence failed:', error);
      clearWorkspaceState();
      throw new Error(getBusinessPersistenceErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState, clearWorkspaceState, ensureBusinessRecord, loadBusinessWorkspace]);

  useEffect(() => {
    let active = true;

    const initializeApp = async () => {
      setLoading(true);

      try {
        const session = await api.getAuthSession().catch(() => ({
          enabled: false,
          authenticated: false,
          user: null,
          loginUrl: '/api/login',
          logoutUrl: '/api/logout',
        }));

        if (!active) return;

        setAuthEnabled(Boolean(session.enabled));
        setIsAuthenticated(Boolean(session.authenticated));
        setAuthUser(session.user || null);
        setLoginUrl(session.loginUrl || '/api/login');
        setLogoutUrl(session.logoutUrl || '/api/logout');

        if (session.enabled && !session.authenticated) {
          clearWorkspaceState();
          return;
        }

        try {
          const business = await api.getBusiness();
          if (!active) return;
          await loadBusinessWorkspace(business);
        } catch (error) {
          if (!active) return;

          clearWorkspaceState();

          if (error?.message && !/Business not found/i.test(error.message)) {
            console.error('Failed to restore workspace session:', error);
          }
        }
      } finally {
        if (active) {
          setAuthReady(true);
          setLoading(false);
        }
      }
    };

    void initializeApp();

    return () => {
      active = false;
    };
  }, [clearWorkspaceState, loadBusinessWorkspace]);

  const onboard = useCallback((formData, options = {}) => hydrateBusinessSession(formData, options), [hydrateBusinessSession]);

  const preparePlaidOnboarding = useCallback((formData) => {
    return hydrateBusinessSession(formData, { markOnboarded: false });
  }, [hydrateBusinessSession]);

  const loadDemo = useCallback(async () => {
    return hydrateBusinessSession(buildDemoFormData(), { markOnboarded: true });
  }, [hydrateBusinessSession]);

  const loadPlaidData = useCallback(async (options = {}) => {
    const {
      completeOnboarding = false,
      sessionOverride = null,
    } = options;

    const plaidUserId = authUser?.auth0Id || 'default-user';

    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        api.getPlaidAccounts(plaidUserId),
        api.getPlaidTransactions(plaidUserId),
      ]);

      const nextAccounts = (accountsResponse.accounts || []).map(normalizeAccount);
      const nextTransactions = (transactionsResponse.transactions || []).map(normalizeTransaction);
      const connected = Boolean(accountsResponse.connected || nextAccounts.length);

      if (!connected) {
        return false;
      }

      const persistedBusiness = await ensureBusinessRecord(sessionOverride?.business || businessInfo, {
        isOnboardedOverride: completeOnboarding ? true : isOnboarded,
        plaidConnectedOverride: true,
      });

      applyLoadedState(
        persistedBusiness,
        nextAccounts,
        nextTransactions,
        sessionOverride?.riskFactors || riskFactors,
        {
          isOnboarded: completeOnboarding ? true : isOnboarded,
          plaidConnected: true,
          resetAnalysis: false,
          resetActiveTab: false,
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to load Plaid data:', error);
      return false;
    }
  }, [applyLoadedState, authUser?.auth0Id, businessInfo, ensureBusinessRecord, isOnboarded, riskFactors]);

  const toggleSidebar = useCallback(() => {
    if (viewportMode === 'mobile') {
      setMobileSidebarOpen((current) => !current);
      return;
    }

    if (viewportMode === 'tablet') {
      setSidebarLocked((current) => {
        const nextLocked = !current;
        setSidebarExpanded(nextLocked);
        return nextLocked;
      });
      return;
    }

    setSidebarExpanded((current) => !current);
  }, [viewportMode]);

  const setSidebarHoverExpanded = useCallback((expanded) => {
    if (viewportMode === 'tablet' && !sidebarLocked) {
      setSidebarExpanded(expanded);
    }
  }, [viewportMode, sidebarLocked]);

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const navigateToTab = useCallback((tabId) => {
    setActiveTab(tabId);

    if (viewportMode === 'mobile') {
      setMobileSidebarOpen(false);
    }
  }, [viewportMode]);

  return (
    <AppContext.Provider value={{
      authReady,
      authEnabled,
      isAuthenticated,
      authUser,
      loginUrl,
      logoutUrl,
      isOnboarded,
      loading,
      plaidConnected,
      businessInfo,
      transactions,
      accounts,
      financialMetrics,
      riskFactors,
      policySummary,
      gapAnalysis,
      activeTab,
      setActiveTab,
      setPolicySummary,
      setGapAnalysis,
      setPlaidConnected,
      ensureBusinessRecord,
      loadPlaidData,
      onboard,
      loadDemo,
      preparePlaidOnboarding,
      viewportMode,
      sidebarExpanded,
      sidebarLocked,
      mobileSidebarOpen,
      setSidebarExpanded,
      setSidebarLocked,
      toggleSidebar,
      setSidebarHoverExpanded,
      openMobileSidebar,
      closeMobileSidebar,
      navigateToTab,
    }}>
      {children}
    </AppContext.Provider>
  );
}
