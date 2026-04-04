import { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';

const DEFAULT_VISIBLE = 20;

export default function TransactionList({ transactions }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!transactions?.length) return null;

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesCategory = categoryFilter === 'all' || txn.category === categoryFilter;
      const matchesSearch = !searchText || txn.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [transactions, categoryFilter, searchText]);

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hasMore = filtered.length > DEFAULT_VISIBLE;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Recent Transactions</h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setShowAll(false); }}
          className="rounded-lg border border-gray-200 bg-bg-main text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search transactions…"
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setShowAll(false); }}
          className="rounded-lg border border-gray-200 bg-bg-main text-text-primary text-sm px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-gray-100">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((txn) => (
              <tr key={txn.id} className="border-b border-gray-50 hover:bg-bg-main">
                <td className="py-2.5 text-text-secondary">{txn.date}</td>
                <td className="py-2.5 text-text-primary font-medium">{txn.description}</td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[txn.category] || '#94a3b8' }} />
                    {CATEGORY_LABELS[txn.category] || txn.category}
                  </span>
                </td>
                <td className={`py-2.5 text-right font-medium ${txn.amount >= 0 ? 'text-covered' : 'text-text-primary'}`}>
                  {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">No transactions match your filters.</p>
      )}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full text-sm text-primary hover:text-primary/80 font-medium py-2 rounded-lg border border-gray-200 hover:bg-bg-main transition-colors"
        >
          Show all transactions ({filtered.length})
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full text-sm text-text-secondary hover:text-text-primary font-medium py-2 rounded-lg border border-gray-200 hover:bg-bg-main transition-colors"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
