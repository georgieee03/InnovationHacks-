import { createContext, useCallback, useState } from 'react';
import transactionsData from '../data/transactions.json';
import riskFactorsData from '../data/riskFactors.json';
import { computeFinancialMetrics } from '../services/financialCalculator';
import { api } from '../services/apiClient';

export const AppContext = createContext(null);

function normalizeBusiness(data, fallback = {}) {
  return {
    id: data?.id ?? fallback.id,
    name: data?.name ?? fallback.name ?? '',
    type: data?.type ?? fallback.type ?? 'restaurant',
    zip: String(data?.zip ?? fallback.zip ?? ''),
    city: data?.city ?? fallback.city ?? '',
    state: data?.state ?? fallback.state ?? '',
    monthlyRevenue: Number(
      data?.monthlyRevenue ??
      data?.monthly_revenue_estimate ??
      fallback.monthlyRevenue ??
      fallback.monthlyRevenueEstimate ??
      0,
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

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    date: typeof transaction.date === 'string' ? transaction.date.slice(0, 10) : transaction.date,
    amount: Number(transaction.amount ?? 0),
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
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [riskFactors, setRiskFactors] = useState(null);
  const [policySummary, setPolicySummary] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('financial');

  const applyLoadedState = useCallback((info, nextAccounts, nextTransactions, nextRiskFactors) => {
    setBusinessInfo(info);
    setAccounts(nextAccounts);
    setTransactions(nextTransactions);
    setRiskFactors(nextRiskFactors);
    setFinancialMetrics(computeFinancialMetrics(nextTransactions, nextAccounts, nextRiskFactors));
    setPolicySummary(null);
    setGapAnalysis(null);
    setActiveTab('financial');
    setIsOnboarded(true);
  }, []);

  const onboard = useCallback(async (formData) => {
    setLoading(true);

    const localSession = buildLocalSession(formData);
    applyLoadedState(
      localSession.business,
      localSession.accounts,
      localSession.transactions,
      localSession.riskFactors,
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

      let remoteRiskFactors = null;
      try {
        remoteRiskFactors = normalizeRiskFactors(await api.getRiskFactors(formData.zip));
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
      const nextRiskFactors = remoteRiskFactors ?? localSession.riskFactors;
      const nextBusiness = normalizeBusiness(createdBusiness, {
        ...formData,
        city: formData.city || nextRiskFactors?.city || localSession.business.city,
        state: formData.state || nextRiskFactors?.state || localSession.business.state,
      });

      applyLoadedState(nextBusiness, nextAccounts, nextTransactions, nextRiskFactors);
    } catch (error) {
      console.error('Onboarding API enrichment failed, using local fallback session:', error);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState]);

  const loadDemo = useCallback(async () => {
    setLoading(true);

    const fallbackSession = buildDemoFallbackSession();
    applyLoadedState(
      fallbackSession.business,
      fallbackSession.accounts,
      fallbackSession.transactions,
      fallbackSession.riskFactors,
    );

    try {
      const demoBusiness = normalizeBusiness(await api.getBusiness(), transactionsData.business);

      let remoteRiskFactors = null;
      try {
        remoteRiskFactors = normalizeRiskFactors(await api.getRiskFactors(demoBusiness.zip));
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
      const nextRiskFactors = remoteRiskFactors ?? fallbackSession.riskFactors;
      const nextBusiness = {
        ...demoBusiness,
        city: demoBusiness.city || nextRiskFactors?.city || fallbackSession.business.city,
        state: demoBusiness.state || nextRiskFactors?.state || fallbackSession.business.state,
      };

      applyLoadedState(nextBusiness, nextAccounts, nextTransactions, nextRiskFactors);
    } catch (error) {
      console.error('Demo API enrichment failed, using local fallback session:', error);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState]);

  return (
    <AppContext.Provider value={{
      isOnboarded,
      loading,
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
      onboard,
      loadDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}
