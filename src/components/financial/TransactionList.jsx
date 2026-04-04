import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';

const DEFAULT_VISIBLE = 20;

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.03 },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function TransactionList({ transactions }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showAll, setShowAll] = useState(false);

  const safeTransactions = transactions ?? [];
  const filtered = useMemo(() => {
    return safeTransactions.filter((txn) => {
      const matchesCategory = categoryFilter === 'all' || txn.category === categoryFilter;
      const matchesSearch = !searchText || txn.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [safeTransactions, categoryFilter, searchText]);

  if (!safeTransactions.length) return null;

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hasMore = filtered.length > DEFAULT_VISIBLE;

  return (
    <div className="rounded-xl border border-gray-100 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-heading font-semibold text-text-primary">Recent Transactions</h3>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setShowAll(false); }}
          className="rounded-lg border border-gray-200 bg-bg-main px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setShowAll(false); }}
          className="flex-1 rounded-lg border border-gray-200 bg-bg-main px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-secondary">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {visible.map((txn, i) => (
                <motion.tr
                  key={txn.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="border-b border-gray-50 hover:bg-bg-main"
                >
                  <td className="py-2.5 text-text-secondary">{txn.date}</td>
                  <td className="py-2.5 font-medium text-text-primary">{txn.description}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[txn.category] || '#94a3b8' }} />
                      {CATEGORY_LABELS[txn.category] || txn.category}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-medium ${txn.amount >= 0 ? 'text-covered' : 'text-text-primary'}`}>
                    {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="py-4 text-center text-sm text-text-secondary">No transactions match your filters.</p>
      )}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-primary transition-colors hover:bg-bg-main hover:text-primary/80"
        >
          Show all transactions ({filtered.length})
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-main hover:text-text-primary"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
