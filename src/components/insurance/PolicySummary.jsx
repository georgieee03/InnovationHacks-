import { motion } from 'framer-motion';

export default function PolicySummary({ summary }) {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl shadow-sm border border-gray-100 p-5"
    >
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Policy Summary</h3>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-text-secondary">Policy Number</p>
          <p className="font-medium text-text-primary">{summary.policyNumber}</p>
        </div>
        <div>
          <p className="text-text-secondary">Insurer</p>
          <p className="font-medium text-text-primary">{summary.insurer}</p>
        </div>
        <div>
          <p className="text-text-secondary">Effective</p>
          <p className="font-medium text-text-primary">{summary.effectiveDate} – {summary.expirationDate}</p>
        </div>
        <div>
          <p className="text-text-secondary">Monthly Premium</p>
          <p className="font-medium text-text-primary">{summary.monthlyPremium}</p>
        </div>
      </div>

      <h4 className="font-heading font-semibold text-text-primary text-sm mb-2">Current Coverages</h4>
      <div className="space-y-2 mb-4">
        {summary.coverages?.map((cov, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * i }}
            className="p-3 bg-bg-main rounded-lg"
          >
            <div className="flex justify-between items-start">
              <p className="font-medium text-text-primary text-sm">{cov.type}</p>
              <span className="text-xs bg-covered/10 text-covered px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">Limit: {cov.limit} · Deductible: {cov.deductible}</p>
            <p className="text-xs text-text-secondary mt-0.5">{cov.details}</p>
          </motion.div>
        ))}
      </div>

      {summary.exclusions?.length > 0 && (
        <>
          <h4 className="font-heading font-semibold text-text-primary text-sm mb-2">Exclusions</h4>
          <div className="flex flex-wrap gap-1.5">
            {summary.exclusions.map((ex, i) => (
              <span key={i} className="text-xs bg-gap/10 text-gap px-2 py-1 rounded-full">{ex}</span>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
