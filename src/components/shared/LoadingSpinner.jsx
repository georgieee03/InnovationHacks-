import { motion } from 'framer-motion';

export default function LoadingSpinner({ message, variant = 'default' }) {
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-3 h-3 rounded-full bg-primary"
              animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
        {message && <motion.p className="mt-4 text-sm text-text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{message}</motion.p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-accent-purple to-accent-green"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {message && <motion.p className="mt-4 text-sm text-text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{message}</motion.p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {message && <motion.p className="mt-4 text-sm text-text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{message}</motion.p>}
    </div>
  );
}
