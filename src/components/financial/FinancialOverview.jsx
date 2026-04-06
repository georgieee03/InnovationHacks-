import { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  TrendingUp, TrendingDown, Minus,
  Landmark, Database, RefreshCw,
  DollarSign, ArrowUpRight, ArrowDownRight,
  Wallet, Activity,
  FileText, Download, AlertTriangle, CheckCircle, Lightbulb,
  Share2, Check, Copy, ShieldCheck, Clock,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { api } from '../../services/apiClient';
import GettingStartedChecklist from '../shared/GettingStartedChecklist';

const MotionDiv = motion.div;

// ─── Tooltip style shared across charts ──────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,17,19,0.96)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
};
const AXIS_STYLE = { fontSize: 11, fill: '#71717a' };
const GRID_COLOR = 'rgba(255,255,255,0.05)';

// ─── Spending category colours ────────────────────────────────────────────────
const CAT_COLORS = {
  rent: '#8b5cf6', supplies: '#3b82f6', payroll: '#10b981',
  utilities: '#f59e0b', equipment: '#ef4444', subscriptions: '#6366f1',
  revenue: '#00CF31', miscellaneous: '#94a3b8',
};
function catColor(key) { return CAT_COLORS[key] || '#94a3b8'; }
function fmtCat(key) {
  return String(key || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, color, delay = 0 }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-covered' : trend === 'down' ? 'text-gap' : 'text-text-secondary';
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="surface-panel rounded-2xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-light tracking-tight text-text-primary">{value}</p>
        {sub && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{sub}</span>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children, delay = 0 }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </MotionDiv>
  );
}

// ─── Burn rate / runway gauge ─────────────────────────────────────────────────
function RunwayGauge({ months, target = 6 }) {
  const pct = Math.min(100, (months / target) * 100);
  const color = months < 2 ? '#ef4444' : months < 4 ? '#f59e0b' : '#10b981';
  const label = months < 2 ? 'Critical' : months < 4 ? 'Low' : months < 6 ? 'Moderate' : 'Healthy';
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-2xl font-light text-text-primary">{months} <span className="text-sm text-text-secondary">months</span></span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}18` }}>{label}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <p className="text-xs text-text-secondary">Target: {target} months of operating expenses</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FinancialOverview() {
  const {
    financialMetrics, accounts, businessInfo,
    riskFactors, transactions, plaidConnected, loadPlaidData,
  } = useContext(AppContext);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checklistData, setChecklistData] = useState({ contracts: [], receipts: [], quotes: [], complianceItems: [] });

  useEffect(() => {
    if (!businessInfo?.id) return;
    Promise.all([
      api.listContracts().catch(() => []),
      api.listReceipts().catch(() => []),
      api.listQuotes().catch(() => []),
      api.listCompliance().catch(() => []),
    ]).then(([contracts, receipts, quotes, complianceItems]) => {
      setChecklistData({
        contracts: Array.isArray(contracts) ? contracts : [],
        receipts: Array.isArray(receipts) ? receipts : [],
        quotes: Array.isArray(quotes) ? quotes : [],
        complianceItems: Array.isArray(complianceItems) ? complianceItems : [],
      });
    });
  }, [businessInfo?.id]);

  if (!financialMetrics) return null;

  const m = financialMetrics;
  const breakdown = m.monthlyBreakdown ?? [];

  // Date range label
  const dateRangeLabel = (() => {
    if (!breakdown.length) return 'No data yet';
    const first = breakdown[0]?.label;
    const last = breakdown[breakdown.length - 1]?.label;
    return first === last ? first : `${first} – ${last}`;
  })();

  // Month-over-month trend for net cash flow
  const lastTwo = breakdown.slice(-2);
  const momChange = lastTwo.length === 2
    ? lastTwo[1].netCashFlow - lastTwo[0].netCashFlow
    : null;
  const momTrend = momChange === null ? 'neutral' : momChange >= 0 ? 'up' : 'down';
  const momLabel = momChange !== null
    ? `${momChange >= 0 ? '+' : ''}${formatCurrency(momChange)} vs last month`
    : null;

  // Profit margin
  const profitMargin = m.averageMonthlyIncome > 0
    ? Math.round(((m.averageMonthlyIncome - m.averageMonthlyExpenses) / m.averageMonthlyIncome) * 100)
    : 0;

  // Spending donut data — top 6 categories
  const spendingData = Object.entries(m.spendingByCategory || {})
    .filter(([k]) => k !== 'revenue')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([key, value]) => ({ name: fmtCat(key), value: Math.round(value), color: catColor(key) }));

  // Net profit area data
  const netData = breakdown.map(b => ({
    label: b.label,
    net: b.netCashFlow,
    income: b.totalIncome,
    expenses: b.totalExpenses,
  }));

  // Top 5 transactions
  const topTxns = [...(transactions || [])]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5);

  const sourceSummary = plaidConnected
    ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} · ${transactions.length} transactions synced`
    : 'Demo data — connect Plaid for live insights';

  const handleRefresh = async () => {
    if (!plaidConnected || isRefreshing) return;
    setIsRefreshing(true);
    try { await loadPlaidData({ completeOnboarding: false }); }
    finally { setIsRefreshing(false); }
  };

  return (
    <AnimatePresence>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-thin tracking-[-0.03em] text-text-primary">Dashboard</h2>
            <p className="mt-1 text-sm text-text-secondary">{businessInfo?.name} · {dateRangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${
              plaidConnected ? 'border-covered/30 bg-covered/10 text-covered' : 'border-white/10 bg-white/5 text-text-secondary'
            }`}>
              {plaidConnected ? 'Live · Plaid' : 'Demo data'}
            </span>
            {plaidConnected && (
              <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-white/20 transition-colors disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Balance"
            value={formatCurrency(m.totalBalance)}
            sub={plaidConnected ? `${accounts.length} linked accounts` : 'Demo balance'}
            trend="neutral"
            icon={Wallet}
            color="bg-primary/10 text-primary"
            delay={0}
          />
          <KpiCard
            label="Avg Monthly Revenue"
            value={formatCurrency(m.averageMonthlyIncome)}
            sub={momLabel}
            trend={momTrend}
            icon={TrendingUp}
            color="bg-covered/10 text-covered"
            delay={0.05}
          />
          <KpiCard
            label="Avg Monthly Expenses"
            value={formatCurrency(m.averageMonthlyExpenses)}
            sub={`${profitMargin}% profit margin`}
            trend={profitMargin > 20 ? 'up' : profitMargin > 0 ? 'neutral' : 'down'}
            icon={ArrowDownRight}
            color="bg-gap/10 text-gap"
            delay={0.1}
          />
          <KpiCard
            label="Cash Runway"
            value={`${m.monthsOfRunway} mo`}
            sub={m.monthsOfRunway < 3 ? 'Below safe threshold' : 'At current burn rate'}
            trend={m.monthsOfRunway >= 6 ? 'up' : m.monthsOfRunway >= 3 ? 'neutral' : 'down'}
            icon={Activity}
            color={m.monthsOfRunway >= 6 ? 'bg-covered/10 text-covered' : m.monthsOfRunway >= 3 ? 'bg-warning/10 text-warning' : 'bg-gap/10 text-gap'}
            delay={0.15}
          />
        </div>

        {/* Cash flow + spending row */}
        <Section delay={0.2}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

            {/* Cash flow — 3 cols */}
            <div className="glass-card p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Cash Flow</p>
                  <p className="text-xs text-text-secondary mt-0.5">Income vs expenses by month</p>
                </div>
                {momChange !== null && (
                  <span className={`text-xs font-medium ${momChange >= 0 ? 'text-covered' : 'text-gap'}`}>
                    {momChange >= 0 ? '+' : ''}{formatCurrency(momChange)} MoM
                  </span>
                )}
              </div>
              {netData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={netData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v, n) => [formatCurrency(v), n]}
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#fafafa', fontSize: 12 }}
                      itemStyle={{ color: '#a1a1aa', fontSize: 12 }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                    <Bar dataKey="income" name="Income" fill="url(#incG)" radius={[4,4,0,0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="url(#expG)" radius={[4,4,0,0]} />
                    <Line dataKey="net" name="Net" type="monotone" stroke="#00CF31" strokeWidth={2.5}
                      dot={{ r: 3, fill: '#00CF31', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#00CF31', stroke: '#111113', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm text-text-secondary">No transaction data yet</p>
                </div>
              )}
            </div>

            {/* Spending donut — 2 cols */}
            <div className="glass-card p-5 lg:col-span-2">
              <div className="mb-4">
                <p className="text-sm font-semibold text-text-primary">Spending Breakdown</p>
                <p className="text-xs text-text-secondary mt-0.5">Top expense categories</p>
              </div>
              {spendingData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={spendingData} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={2}>
                        {spendingData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="rgba(17,17,19,0.6)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [formatCurrency(v), n]}
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#a1a1aa', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {spendingData.slice(0, 4).map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-text-secondary">{d.name}</span>
                        </div>
                        <span className="text-text-primary font-medium">{formatCurrency(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center">
                  <p className="text-sm text-text-secondary">No expense data yet</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Net profit trend + runway row */}
        <Section delay={0.25}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Net profit area — 2 cols */}
            <div className="glass-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Net Profit Trend</p>
                  <p className="text-xs text-text-secondary mt-0.5">Monthly net after all expenses</p>
                </div>
                <span className={`text-sm font-medium ${profitMargin >= 0 ? 'text-covered' : 'text-gap'}`}>
                  {profitMargin}% margin
                </span>
              </div>
              {netData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={netData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00CF31" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00CF31" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Net profit']}
                      contentStyle={TOOLTIP_STYLE}
                      itemStyle={{ color: '#a1a1aa', fontSize: 12 }}
                      cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                    <Area dataKey="net" stroke="#00CF31" strokeWidth={2} fill="url(#netG)"
                      dot={{ r: 3, fill: '#00CF31', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#00CF31', stroke: '#111113', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center">
                  <p className="text-sm text-text-secondary">No data yet</p>
                </div>
              )}
            </div>

            {/* Runway gauge — 1 col */}
            <div className="glass-card p-5 flex flex-col justify-between">
              <div className="mb-4">
                <p className="text-sm font-semibold text-text-primary">Cash Runway</p>
                <p className="text-xs text-text-secondary mt-0.5">How long reserves last at current burn</p>
              </div>
              <RunwayGauge months={m.monthsOfRunway} target={6} />
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Monthly burn</span>
                  <span className="text-text-primary font-medium">{formatCurrency(m.averageMonthlyExpenses)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Reserve target</span>
                  <span className="text-text-primary font-medium">{formatCurrency(m.recommendedEmergencyFund)}</span>
                </div>
                {m.emergencyFundGap > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gap">Gap</span>
                    <span className="text-gap font-medium">{formatCurrency(m.emergencyFundGap)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Accounts + top transactions row */}
        <Section delay={0.3}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Account balances */}
            {accounts.length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  {plaidConnected ? <Landmark className="h-4 w-4 text-covered" /> : <Database className="h-4 w-4 text-primary" />}
                  <p className="text-sm font-semibold text-text-primary">
                    {plaidConnected ? 'Linked Accounts' : 'Demo Accounts'}
                  </p>
                  <span className="ml-auto text-xs text-text-secondary">{sourceSummary}</span>
                </div>
                <div className="space-y-2">
                  {accounts.map(acct => (
                    <div key={acct.id} className="surface-panel rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Landmark className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{acct.name}</p>
                          <p className="text-xs text-text-secondary capitalize">{acct.type || 'account'}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(acct.balance)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top transactions */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-text-primary">Recent Transactions</p>
                <span className="text-xs text-text-secondary">{transactions.length} total</span>
              </div>
              {topTxns.length > 0 ? (
                <div className="space-y-2">
                  {topTxns.map((txn, i) => {
                    const isIncome = txn.type === 'income' || txn.amount > 0;
                    return (
                      <div key={txn.id || i} className="surface-panel rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${isIncome ? 'bg-covered/10' : 'bg-gap/10'}`}>
                            {isIncome
                              ? <ArrowUpRight className="h-3.5 w-3.5 text-covered" />
                              : <ArrowDownRight className="h-3.5 w-3.5 text-gap" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary truncate">{txn.description || txn.name || 'Transaction'}</p>
                            <p className="text-xs text-text-secondary">{txn.date} · {txn.category}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold flex-shrink-0 ml-3 ${isIncome ? 'text-covered' : 'text-gap'}`}>
                          {isIncome ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-6">No transactions yet</p>
              )}
            </div>
          </div>
        </Section>

        {/* Getting started checklist */}
        <Section delay={0.35}>
          <GettingStartedChecklist
            contracts={checklistData.contracts}
            receipts={checklistData.receipts}
            quotes={checklistData.quotes}
            complianceItems={checklistData.complianceItems}
          />
        </Section>

      </div>
    </AnimatePresence>
  );
}
