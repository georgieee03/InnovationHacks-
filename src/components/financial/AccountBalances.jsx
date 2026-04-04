import { Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useCardTilt } from '../../hooks/useCursorPosition';
import StatValue from '../shared/StatValue';

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

function AccountCard({ acct, index }) {
  const cardRef = useRef(null);
  const tilt = useCardTilt(cardRef, 5);

  return (
    <motion.div
      ref={cardRef}
      className="group flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Landmark className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-normal text-text-primary">{acct.name}</p>
        <p className="text-xs font-light text-text-secondary">{acct.institution} · {acct.type}</p>
      </div>
      <StatValue value={acct.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} color="neutral" size="sm" className="text-right" />
    </motion.div>
  );
}

export default function AccountBalances({ accounts }) {
  if (!accounts?.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-2xl font-heading font-light tracking-[-0.02em] text-text-primary mb-4">Account Balances</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acct, i) => (
          <AccountCard key={acct.id} acct={acct} index={i} />
        ))}
      </div>
    </div>
  );
}
