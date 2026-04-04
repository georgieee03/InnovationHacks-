import { motion } from 'framer-motion';

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div key={i} className="skeleton h-4 rounded-lg"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="skeleton h-5 w-1/3 mb-4 rounded-lg" />
      <SkeletonText lines={3} />
      <div className="skeleton h-10 w-full mt-4 rounded-lg" />
    </motion.div>
  );
}

export function SkeletonChart({ className = '', height = 200 }) {
  return (
    <motion.div className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="skeleton h-5 w-1/4 mb-4 rounded-lg" />
      <div className="flex items-end gap-2" style={{ height }}>
        {[40, 65, 50, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
          <motion.div key={i} className="skeleton flex-1 rounded-t-lg" style={{ height: `${h}%` }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <motion.div className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="skeleton h-5 w-1/4 mb-4 rounded-lg" />
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <motion.div key={i} className="skeleton h-4 flex-1 rounded-lg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} />
          ))}
        </div>
        <div className="border-t border-white/10" />
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <motion.div key={c} className="skeleton h-4 flex-1 opacity-70 rounded-lg"
                initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                transition={{ delay: (r + 1) * 0.05 + c * 0.02 }} />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
