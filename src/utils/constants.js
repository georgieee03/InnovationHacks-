export const CATEGORY_COLORS = {
  rent: '#8b5cf6',
  supplies: '#3b82f6',
  payroll: '#10b981',
  utilities: '#f59e0b',
  equipment: '#ef4444',
  subscriptions: '#6366f1',
  miscellaneous: '#94a3b8',
  revenue: '#10b981',
};

export const CATEGORY_LABELS = {
  rent: 'Rent',
  supplies: 'Supplies',
  payroll: 'Payroll',
  utilities: 'Utilities',
  equipment: 'Equipment',
  subscriptions: 'Subscriptions',
  miscellaneous: 'Miscellaneous',
  revenue: 'Revenue',
  other: 'Other',
};

export const RISK_LEVEL_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export function formatCategoryLabel(category) {
  if (!category) {
    return 'Other';
  }

  if (CATEGORY_LABELS[category]) {
    return CATEGORY_LABELS[category];
  }

  return String(category)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
