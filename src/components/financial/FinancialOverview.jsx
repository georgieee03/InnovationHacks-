import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Landmark, RefreshCw } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import MetricCard from '../shared/MetricCard';
import AccountBalances from './AccountBalances';
import CashFlowChart from './CashFlowChart';
import SpendingChart from './SpendingChart';
import TransactionList from './TransactionList';
import EmergencyFund from './EmergencyFund';

const MotionDiv = motion.div;

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: index * 0.1 },
  }),
};

export default function FinancialOverview() {
  const {
    financialMetrics,
    accounts,
    businessInfo,
    riskFactors,
    transactions,
    plaidConnected,
    loadPlaidData,
  } = useContext(AppContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!financialMetrics) return null;

  const runwayColor = financialMetrics.monthsOfRunway < 3
    ? 'text-gap'
    : financialMetrics.monthsOfRunway < 6
      ? 'text-underinsured'
      : 'text-covered';
  const monthlyBreakdown = financialMetrics.monthlyBreakdown ?? [];
  const dateRangeLabel = (() => {
    if (!monthlyBreakdown.length) {
      return 'Financial activity loaded';
    }

    const first = monthlyBreakdown[0];
    const last = monthlyBreakdown[monthlyBreakdown.length - 1];

    if (!first?.label) {
      return 'Financial activity loaded';
    }

    if (first.label === last?.label) {
      return first.label;
    }

    return `${first.label} to ${last?.label}`;
  })();
  const sourceSummary = plaidConnected
    ? `${accounts.length} linked account${accounts.length === 1 ? '' : 's'} and ${transactions.length} transaction${transactions.length === 1 ? '' : 's'} synced from Plaid.`
    : 'Using demo and fallback financial data until a Plaid account is linked.';

  const handleRefresh = async () => {
    if (!plaidConnected || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await loadPlaidData({ completeOnboarding: false });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Financial Overview</h2>
          <p className="mt-1.5 text-sm font-light text-text-secondary">
            {businessInfo?.name} - {dateRangeLabel}
          </p>
        </div>

        <div className="surface-panel flex flex-col gap-4 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="surface-chip flex h-10 w-10 items-center justify-center rounded-xl">
              {plaidConnected ? (
                <Landmark className="h-5 w-5 text-covered" />
              ) : (
                <Database className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {plaidConnected ? 'Live financial data' : 'Demo financial snapshot'}
                </p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${
                  plaidConnected
                    ? 'border-covered/30 bg-covered/10 text-covered'
                    : 'border-primary/20 bg-primary/10 text-primary'
                }`}
                >
                  {plaidConnected ? 'Live via Plaid' : 'Demo / Fallback'}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">{sourceSummary}</p>
            </div>
          </div>

          {plaidConnected ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="surface-chip focus-ring-brand inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh live data'}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Balance" value={formatCurrency(financialMetrics.totalBalance)} color="text-primary" delay={0} />
          <MetricCard title="Avg Monthly Revenue" value={formatCurrency(financialMetrics.averageMonthlyIncome)} color="text-covered" trend="up" delay={0.1} />
          <MetricCard title="Avg Monthly Expenses" value={formatCurrency(financialMetrics.averageMonthlyExpenses)} color="text-text-primary" delay={0.15} />
          <MetricCard
            title="Monthly Runway"
            value={`${financialMetrics.monthsOfRunway} months`}
            color={runwayColor}
            subtitle={financialMetrics.monthsOfRunway < 3 ? 'Critical - below 3 months' : undefined}
            delay={0.2}
          />
        </div>

        <MotionDiv custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
          <AccountBalances accounts={accounts} />
        </MotionDiv>

        <MotionDiv custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CashFlowChart data={financialMetrics.monthlyBreakdown} />
            <SpendingChart data={financialMetrics.spendingByCategory} />
          </div>
        </MotionDiv>

        <MotionDiv custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
          <EmergencyFund metrics={financialMetrics} riskFactors={riskFactors} businessInfo={businessInfo} />
        </MotionDiv>

        <MotionDiv custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
          <TransactionList transactions={financialMetrics.recentTransactions} />
        </MotionDiv>
      </div>
    </AnimatePresence>
  );
}
