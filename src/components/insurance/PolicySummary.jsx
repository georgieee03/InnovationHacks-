import { motion } from 'framer-motion';

export default function PolicySummary({ summary }) {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
    >
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">Policy Summary</h3>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-text-secondary">Policy Number</p>
          <p className="font-normal text-text-primary">{summary.policyNumber}</p>
        </div>
        <div>
          <p className="text-text-secondary">Insurer</p>
          <p className="font-normal text-text-primary">{summary.insurer}</p>
        </div>
        <div>
          <p className="text-text-secondary">Effective</p>
          <p className="font-normal text-text-primary">{summary.effectiveDate} to {summary.expirationDate}</p>
        </div>
        <div>
          <p className="text-text-secondary">Monthly Premium</p>
          <p className="font-normal text-text-primary">{summary.monthlyPremium}</p>
        </div>
      </div>

      <h4 className="mb-2 text-sm font-heading font-normal tracking-[-0.02em] text-text-primary">Current Coverages</h4>
      <div className="mb-4 space-y-2">
        {summary.coverages?.map((cov, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * i }}
            className="surface-panel rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-normal text-text-primary">{cov.type}</p>
              <span className="rounded-full border border-covered/30 bg-covered/20 px-2 py-0.5 text-xs text-covered">Active</span>
            </div>
            <p className="mt-1 text-xs font-light text-text-secondary">Limit: {cov.limit} - Deductible: {cov.deductible}</p>
            <p className="readable-copy mt-0.5 text-xs font-light">{cov.details}</p>
          </motion.div>
        ))}
      </div>

      {summary.exclusions?.length > 0 && (
        <>
          <h4 className="mb-2 text-sm font-heading font-normal tracking-[-0.02em] text-text-primary">Exclusions</h4>
          <div className="flex flex-wrap gap-1.5">
            {summary.exclusions.map((ex, i) => (
              <span key={i} className="rounded-full border border-gap/30 bg-gap/20 px-2 py-1 text-xs text-gap">{ex}</span>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
