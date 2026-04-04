const MONTH_LABELS = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export function computeFinancialMetrics(transactions, accounts, riskFactors) {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Group transactions by month
  const monthMap = {};
  const categoryTotals = {};

  for (const txn of transactions) {
    const monthKey = txn.date.substring(0, 7); // "2025-11"
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { income: 0, expenses: 0 };
    }
    if (txn.type === 'income') {
      monthMap[monthKey].income += txn.amount;
    } else {
      monthMap[monthKey].expenses += Math.abs(txn.amount);
      const cat = txn.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(txn.amount);
    }
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const monthlyBreakdown = sortedMonths.map((m) => {
    const [year, mo] = m.split('-');
    return {
      month: m,
      label: `${MONTH_LABELS[mo]} ${year}`,
      totalIncome: Math.round(monthMap[m].income * 100) / 100,
      totalExpenses: Math.round(monthMap[m].expenses * 100) / 100,
      netCashFlow: Math.round((monthMap[m].income - monthMap[m].expenses) * 100) / 100,
    };
  });

  // Use only full months for averages (exclude partial Feb 2026)
  const fullMonths = monthlyBreakdown.filter((m) => m.month !== '2026-02');
  const avgExpenses = fullMonths.length
    ? Math.round(fullMonths.reduce((s, m) => s + m.totalExpenses, 0) / fullMonths.length)
    : 0;
  const avgIncome = fullMonths.length
    ? Math.round(fullMonths.reduce((s, m) => s + m.totalIncome, 0) / fullMonths.length)
    : 0;

  const multiplier = riskFactors?.emergencyFundMultiplier || 3;
  const recommendedEmergencyFund = avgExpenses * multiplier;
  const emergencyFundGap = Math.max(0, recommendedEmergencyFund - totalBalance);
  const emergencyFundPercent = recommendedEmergencyFund > 0
    ? Math.min(100, Math.round((totalBalance / recommendedEmergencyFund) * 1000) / 10)
    : 100;

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  return {
    totalBalance: Math.round(totalBalance * 100) / 100,
    monthlyBreakdown,
    spendingByCategory: categoryTotals,
    averageMonthlyExpenses: avgExpenses,
    averageMonthlyIncome: avgIncome,
    currentReserves: Math.round(totalBalance * 100) / 100,
    monthsOfRunway: avgExpenses > 0
      ? Math.round((totalBalance / avgExpenses) * 100) / 100
      : 0,
    recommendedEmergencyFund,
    emergencyFundGap: Math.round(emergencyFundGap * 100) / 100,
    emergencyFundPercent,
    recentTransactions,
  };
}
