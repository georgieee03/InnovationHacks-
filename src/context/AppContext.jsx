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
    monthlyRevenue: Number(
      data?.monthlyRevenue
      ?? data?.monthly_revenue_estimate
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

function buildDemoFallbackSession() {
  const business = normalizeBusiness(transactionsData.business);

  return {
    business,
    riskFactors: getLocalRiskFactors(business.zip),
    accounts: getLocalAccounts(),
    transactions: getLocalTransactions(),
  };
}

export function AppProvider({ children }) {
  const initialViewportMode = typeof window === 'undefined' ? 'desktop' : getViewportMode(window.innerWidth);
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

  const applyLoadedState = useCallback((
    info,
    nextAccounts,
    nextTransactions,
    nextRiskFactors,
    options = {}
  ) => {
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

  const hydrateBusinessSession = useCallback(async (formData, options = {}) => {
    const { markOnboarded = true } = options;
    setLoading(true);

    const localSession = buildLocalSession(formData);
    applyLoadedState(
      localSession.business,
      localSession.accounts,
      localSession.transactions,
      localSession.riskFactors,
      {
        isOnboarded: markOnboarded,
        plaidConnected: false,
      }
    );

    try {
      const createdBusiness = await api.createBusiness({
        name: formData.name,
        type: formData.type,
        zip: formData.zip,
        city: formData.city,
        state: formData.state,
        monthlyRevenue: formData.monthlyRevenue,
        employees: formData.employees,
      });

      let remoteRiskFactors = localSession.riskFactors;
      try {
        remoteRiskFactors = normalizeRiskFactors(await api.getRiskFactors(formData.zip)) ?? localSession.riskFactors;
      } catch {
        remoteRiskFactors = localSession.riskFactors;
      }

      let remoteBundle = { accounts: [], transactions: [] };
      try {
        remoteBundle = await api.getTransactions(createdBusiness.id);
      } catch {
        remoteBundle = { accounts: [], transactions: [] };
      }

      const nextAccounts = remoteBundle.accounts?.length
        ? remoteBundle.accounts.map(normalizeAccount)
        : localSession.accounts;
      const nextTransactions = remoteBundle.transactions?.length
        ? remoteBundle.transactions.map(normalizeTransaction)
        : localSession.transactions;
      const nextBusiness = normalizeBusiness(createdBusiness, {
        ...formData,
        city: formData.city || remoteRiskFactors?.city || localSession.business.city,
        state: formData.state || remoteRiskFactors?.state || localSession.business.state,
      });

      applyLoadedState(nextBusiness, nextAccounts, nextTransactions, remoteRiskFactors, {
        isOnboarded: markOnboarded,
        plaidConnected: false,
      });

      return {
        business: nextBusiness,
        riskFactors: remoteRiskFactors,
      };
    } catch (error) {
      console.error('Onboarding API enrichment failed, using local fallback session:', error);
      return {
        business: localSession.business,
        riskFactors: localSession.riskFactors,
      };
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState]);

  const onboard = useCallback((formData, options = {}) => {
    return hydrateBusinessSession(formData, options);
  }, [hydrateBusinessSession]);

  const preparePlaidOnboarding = useCallback((formData) => {
    return hydrateBusinessSession(formData, { markOnboarded: false });
  }, [hydrateBusinessSession]);

  const loadDemo = useCallback(async () => {
    setLoading(true);

    const fallbackSession = buildDemoFallbackSession();
    applyLoadedState(
      fallbackSession.business,
      fallbackSession.accounts,
      fallbackSession.transactions,
      fallbackSession.riskFactors,
      {
        isOnboarded: true,
        plaidConnected: false,
      }
    );

    try {
      const demoBusiness = normalizeBusiness(await api.getBusiness(), transactionsData.business);

      let remoteRiskFactors = fallbackSession.riskFactors;
      try {
        remoteRiskFactors = normalizeRiskFactors(await api.getRiskFactors(demoBusiness.zip)) ?? fallbackSession.riskFactors;
      } catch {
        remoteRiskFactors = fallbackSession.riskFactors;
      }

      let remoteBundle = { accounts: [], transactions: [] };
      try {
        remoteBundle = await api.getTransactions(demoBusiness.id);
      } catch {
        remoteBundle = { accounts: [], transactions: [] };
      }

      const nextAccounts = remoteBundle.accounts?.length
        ? remoteBundle.accounts.map(normalizeAccount)
        : fallbackSession.accounts;
      const nextTransactions = remoteBundle.transactions?.length
        ? remoteBundle.transactions.map(normalizeTransaction)
        : fallbackSession.transactions;
      const nextBusiness = {
        ...demoBusiness,
        city: demoBusiness.city || remoteRiskFactors?.city || fallbackSession.business.city,
        state: demoBusiness.state || remoteRiskFactors?.state || fallbackSession.business.state,
      };

      applyLoadedState(nextBusiness, nextAccounts, nextTransactions, remoteRiskFactors, {
        isOnboarded: true,
        plaidConnected: false,
      });
    } catch (error) {
      console.error('Demo API enrichment failed, using local fallback session:', error);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState]);

  const loadPlaidData = useCallback(async (options = {}) => {
    const {
      completeOnboarding = false,
      sessionOverride = null,
    } = options;

    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        api.getPlaidAccounts(),
        api.getPlaidTransactions(),
      ]);

      const nextAccounts = (accountsResponse.accounts || []).map(normalizeAccount);
      const nextTransactions = (transactionsResponse.transactions || []).map(normalizeTransaction);
      const connected = Boolean(accountsResponse.connected || nextAccounts.length);

      if (!connected) {
        return false;
      }

      applyLoadedState(
        sessionOverride?.business || businessInfo,
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
  }, [applyLoadedState, businessInfo, isOnboarded, riskFactors]);

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
