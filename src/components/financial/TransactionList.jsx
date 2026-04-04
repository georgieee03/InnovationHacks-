import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORY_COLORS, formatCategoryLabel } from '../../utils/constants';

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

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((txn) => {
      const matchesCategory = categoryFilter === 'all' || txn.category === categoryFilter;
      const matchesSearch = !searchText || txn.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [transactions, categoryFilter, searchText]);
  const availableCategories = useMemo(() => {
    return [...new Set((transactions ?? []).map((txn) => txn.category).filter(Boolean))].sort();
  }, [transactions]);

  if (!transactions?.length) return null;

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hasMore = filtered.length > DEFAULT_VISIBLE;

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Recent Transactions</h3>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setShowAll(false);
          }}
          className="control-input focus-ring-brand rounded-lg px-3 py-2 text-sm text-text-primary transition-all duration-200"
        >
          <option value="all" className="bg-bg-main">All Categories</option>
          {availableCategories.map((category) => (
            <option key={category} value={category} className="bg-bg-main">
              {formatCategoryLabel(category)}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setShowAll(false);
          }}
          className="control-input focus-ring-brand flex-1 rounded-lg px-3 py-2 text-sm text-text-primary transition-all duration-200 placeholder-text-muted"
        />
      </div>

      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-text-secondary">
              <th className="pb-2 font-normal uppercase tracking-[0.04em]">Date</th>
              <th className="pb-2 font-normal uppercase tracking-[0.04em]">Description</th>
              <th className="pb-2 font-normal uppercase tracking-[0.04em]">Category</th>
              <th className="pb-2 text-right font-normal uppercase tracking-[0.04em]">Amount</th>
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
                  className="surface-row border-b border-white/5"
                >
                  <td className="py-2.5 text-text-secondary">{txn.date}</td>
                  <td className="py-2.5 font-normal text-text-primary">{txn.description}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[txn.category] || '#94a3b8' }} />
                      {formatCategoryLabel(txn.category)}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-normal ${txn.amount >= 0 ? 'text-covered' : 'text-text-primary'}`}>
                    {txn.amount >= 0 ? '+' : ''}
                    {formatCurrency(txn.amount)}
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
          className="surface-panel focus-ring-brand mt-3 w-full rounded-lg py-2 text-sm font-normal text-primary transition-all duration-200 hover:border-primary/30 hover:text-primary/80"
        >
          Show all transactions ({filtered.length})
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="surface-panel focus-ring-brand mt-3 w-full rounded-lg py-2 text-sm font-normal text-text-secondary transition-all duration-200 hover:text-text-primary"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
