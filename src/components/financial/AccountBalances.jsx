import { Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function AccountBalances({ accounts }) {
  if (!accounts?.length) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Account Balances</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acct, i) => (
          <motion.div
            key={acct.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-bg-main"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{acct.name}</p>
              <p className="text-xs text-text-secondary">{acct.institution} · {acct.type}</p>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatCurrency(acct.balance)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
