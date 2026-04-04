import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import MetricCard from '../shared/MetricCard';
import AccountBalances from './AccountBalances';
import CashFlowChart from './CashFlowChart';
import SpendingChart from './SpendingChart';
import TransactionList from './TransactionList';
import EmergencyFund from './EmergencyFund';

export default function FinancialOverview() {
  const { financialMetrics, accounts, businessInfo, riskFactors } = useContext(AppContext);

  if (!financialMetrics) return null;

  const runwayColor = financialMetrics.monthsOfRunway < 3
    ? 'text-gap' : financialMetrics.monthsOfRunway < 6
    ? 'text-underinsured' : 'text-covered';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Financial Overview</h2>
        <p className="text-text-secondary mt-1">
          {businessInfo?.name} — Nov 2025 to Feb 2026
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Balance" value={formatCurrency(financialMetrics.totalBalance)} color="text-primary" />
        <MetricCard title="Avg Monthly Revenue" value={formatCurrency(financialMetrics.averageMonthlyIncome)} color="text-covered" trend="up" />
        <MetricCard title="Avg Monthly Expenses" value={formatCurrency(financialMetrics.averageMonthlyExpenses)} color="text-text-primary" />
        <MetricCard title="Monthly Runway" value={`${financialMetrics.monthsOfRunway} months`} color={runwayColor}
          subtitle={financialMetrics.monthsOfRunway < 3 ? 'Critical — below 3 months' : undefined} />
      </div>

      <AccountBalances accounts={accounts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={financialMetrics.monthlyBreakdown} />
        <SpendingChart data={financialMetrics.spendingByCategory} />
      </div>

      <EmergencyFund metrics={financialMetrics} riskFactors={riskFactors} businessInfo={businessInfo} />

      <TransactionList transactions={financialMetrics.recentTransactions} />
    </div>
  );
}
