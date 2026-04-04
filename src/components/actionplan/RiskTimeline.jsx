import { motion } from 'framer-motion';

export default function RiskTimeline({ gaps }) {
  if (!gaps?.length) return null;

  const priorityOrder = { critical: 0, recommended: 1, conditional: 2 };
  const sorted = [...gaps]
    .filter(g => g.status === 'gap' || g.status === 'underinsured')
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  if (!sorted.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-2xl font-heading font-light tracking-[-0.02em] text-text-primary mb-4">Priority Action Items</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
        <div className="space-y-4">
          {sorted.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * i }}
              className="flex items-start gap-4 relative"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 * i + 0.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-normal z-10 ${
                  item.priority === 'critical' ? 'bg-gap' :
                  item.priority === 'recommended' ? 'bg-underinsured' : 'bg-primary'
                }`}
              >
                {i + 1}
              </motion.div>
              <div className="flex-1 pb-2">
                <p className="font-normal text-text-primary">{item.name}</p>
                <p className="text-sm font-light text-text-secondary">{item.statusLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
