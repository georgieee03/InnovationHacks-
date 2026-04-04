import { Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useCardTilt } from '../../hooks/useCursorPosition';
import StatValue from '../shared/StatValue';

const MotionDiv = motion.div;

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: index * 0.1 },
  }),
};

function formatAccountType(value) {
  if (!value) {
    return 'Account';
  }

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function AccountCard({ acct, index }) {
  const cardRef = useRef(null);
  const tilt = useCardTilt(cardRef, 5);

  return (
    <MotionDiv
      ref={cardRef}
      className="surface-panel group flex items-center gap-4 rounded-lg p-4 transition-all duration-300 hover:border-primary/30"
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
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Landmark className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-normal text-text-primary">{acct.name}</p>
        <p className="text-xs font-light text-text-secondary">
          {acct.institution || 'Linked account'} - {formatAccountType(acct.type)}
        </p>
      </div>
      <StatValue
        value={acct.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
        color="neutral"
        size="sm"
        reflective={false}
        className="text-right"
      />
    </MotionDiv>
  );
}

export default function AccountBalances({ accounts }) {
  if (!accounts?.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Account Balances</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {accounts.map((acct, index) => (
          <AccountCard key={acct.id} acct={acct} index={index} />
        ))}
      </div>
    </div>
  );
}
