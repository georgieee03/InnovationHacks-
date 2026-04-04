import { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import MetricCard from '../shared/MetricCard';
import AccountBalances from './AccountBalances';
import CashFlowChart from './CashFlowChart';
import SpendingChart from './SpendingChart';
import TransactionList from './TransactionList';
import EmergencyFund from './EmergencyFund';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function FinancialOverview() {
  const { financialMetrics, accounts, businessInfo, riskFactors } = useContext(AppContext);

  if (!financialMetrics) return null;

  const runwayColor = financialMetrics.monthsOfRunway < 3
    ? 'text-gap'
    : financialMetrics.monthsOfRunway < 6
      ? 'text-underinsured'
      : 'text-covered';

  return (
    <AnimatePresence>
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Financial Overview</h2>
          <p className="mt-1.5 text-sm font-light text-text-secondary">
            {businessInfo?.name} · Nov 2025 to Feb 2026
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Balance" value={formatCurrency(financialMetrics.totalBalance)} color="text-primary" delay={0} />
          <MetricCard title="Avg Monthly Revenue" value={formatCurrency(financialMetrics.averageMonthlyIncome)} color="text-covered" trend="up" delay={0.1} />
          <MetricCard title="Avg Monthly Expenses" value={formatCurrency(financialMetrics.averageMonthlyExpenses)} color="text-text-primary" delay={0.15} />
          <MetricCard
            title="Monthly Runway"
            value={`${financialMetrics.monthsOfRunway} months`}
            color={runwayColor}
            subtitle={financialMetrics.monthsOfRunway < 3 ? 'Critical · below 3 months' : undefined}
            delay={0.2}
          />
        </div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
          <AccountBalances accounts={accounts} />
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CashFlowChart data={financialMetrics.monthlyBreakdown} />
            <SpendingChart data={financialMetrics.spendingByCategory} />
          </div>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
          <EmergencyFund metrics={financialMetrics} riskFactors={riskFactors} businessInfo={businessInfo} />
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
          <TransactionList transactions={financialMetrics.recentTransactions} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
