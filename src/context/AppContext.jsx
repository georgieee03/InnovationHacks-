import { createContext, useState, useCallback } from 'react';
import transactionsData from '../data/transactions.json';
import riskFactorsData from '../data/riskFactors.json';
import { computeFinancialMetrics } from '../services/financialCalculator';

export const AppContext = createContext(null);

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
      onboard, loadDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}
