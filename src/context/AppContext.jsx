import { createContext, useState, useCallback } from 'react';
import transactionsData from '../data/transactions.json';
import riskFactorsData from '../data/riskFactors.json';
import { computeFinancialMetrics } from '../services/financialCalculator';

export const AppContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AppProvider({ children }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [riskFactors, setRiskFactors] = useState(null);
  const [policySummary, setPolicySummary] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('financial');
  const [plaidConnected, setPlaidConnected] = useState(false);

  const recalcMetrics = useCallback((txns, accts, rf) => {
    const metrics = computeFinancialMetrics(txns, accts, rf);
    setFinancialMetrics(metrics);
  }, []);

  const loadPlaidData = useCallback(async () => {
    try {
      const [acctRes, txnRes] = await Promise.all([
        fetch(`${API_BASE}/api/plaid/accounts?user_id=default-user`),
        fetch(`${API_BASE}/api/plaid/transactions?user_id=default-user&days=90`),
      ]);
      const acctData = await acctRes.json();
      const txnData = await txnRes.json();

      if (acctData.accounts?.length) {
        setAccounts(acctData.accounts);
        const txns = txnData.transactions || [];
        if (txns.length) setTransactions(txns);
        recalcMetrics(
          txns.length ? txns : transactions,
          acctData.accounts,
          riskFactors
        );
      }
    } catch (err) {
      console.error('Failed to load Plaid data:', err);
    }
  }, [riskFactors, transactions, recalcMetrics]);

  const onboard = useCallback((info) => {
    setBusinessInfo(info);
    const txns = transactionsData.transactions;
    const accts = transactionsData.accounts;
    setTransactions(txns);
    setAccounts(accts);
    const rf = riskFactorsData[info.zip] || null;
    setRiskFactors(rf);
    const metrics = computeFinancialMetrics(txns, accts, rf);
    setFinancialMetrics(metrics);
    setIsOnboarded(true);
  }, []);

  const loadDemo = useCallback(() => {
    onboard({
      name: "Maria's Bakery",
      type: 'restaurant',
      zip: '77004',
      city: 'Houston',
      state: 'TX',
      monthlyRevenue: 12000,
      employees: 2,
    });
  }, [onboard]);

  return (
    <AppContext.Provider value={{
      isOnboarded, businessInfo, transactions, accounts,
      financialMetrics, riskFactors, activeTab, setActiveTab,
      policySummary, setPolicySummary, gapAnalysis, setGapAnalysis,
      plaidConnected, setPlaidConnected, loadPlaidData,
      onboard, loadDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}
