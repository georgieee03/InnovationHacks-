import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/constants';

export default function TransactionList({ transactions }) {
  if (!transactions?.length) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Recent Transactions</h3>
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
            {transactions.map((txn) => (
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
    </div>
  );
}
