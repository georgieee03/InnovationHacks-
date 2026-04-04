import { createContext, useState, useCallback, useEffect } from 'react';
import transactionsData from '../data/transactions.json';
import riskFactorsData from '../data/riskFactors.json';
import { computeFinancialMetrics } from '../services/financialCalculator';

export const AppContext = createContext(null);

function getViewportMode(width) {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function AppProvider({ children }) {
  const initialViewportMode = typeof window === 'undefined' ? 'desktop' : getViewportMode(window.innerWidth);
  const [isOnboarded, setIsOnboarded] = useState(false);
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
      isOnboarded, businessInfo, transactions, accounts,
      financialMetrics, riskFactors, activeTab, setActiveTab,
      policySummary, setPolicySummary, gapAnalysis, setGapAnalysis,
      viewportMode, sidebarExpanded, sidebarLocked, mobileSidebarOpen,
      setSidebarExpanded, setSidebarLocked, toggleSidebar, setSidebarHoverExpanded,
      openMobileSidebar, closeMobileSidebar, navigateToTab,
      onboard, loadDemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}
