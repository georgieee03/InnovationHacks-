import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

function formatPremium(value) {
  if (typeof value === 'number') {
    return formatCurrency(value);
  }

  return value || 'N/A';
}

export default function PolicySummary({ summary }) {
  if (!summary) {
    return null;
  }

  const effectiveStart = summary.effectiveDates?.start || summary.effectiveDate || 'N/A';
  const effectiveEnd = summary.effectiveDates?.end || summary.expirationDate || 'N/A';
  const activeCoverages = (summary.coverages ?? []).filter((coverage) => coverage.covered !== false);
  const uncoveredCoverages = (summary.coverages ?? []).filter((coverage) => coverage.covered === false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-gray-100 bg-card p-5 shadow-sm"
    >
      <h3 className="mb-4 text-lg font-heading font-semibold text-text-primary">Policy Summary</h3>

      <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-text-secondary">Policy Number</p>
          <p className="font-medium text-text-primary">{summary.policyNumber || 'N/A'}</p>
        </div>
        <div>
          <p className="text-text-secondary">Insurer</p>
          <p className="font-medium text-text-primary">{summary.insurer || 'N/A'}</p>
        </div>
        <div>
          <p className="text-text-secondary">Effective Dates</p>
          <p className="font-medium text-text-primary">{effectiveStart} to {effectiveEnd}</p>
        </div>
        <div>
          <p className="text-text-secondary">Monthly Premium</p>
          <p className="font-medium text-text-primary">{formatPremium(summary.monthlyPremium)}</p>
        </div>
      </div>

      <h4 className="mb-2 text-sm font-heading font-semibold text-text-primary">Current Coverages</h4>
      <div className="mb-4 space-y-2">
        {activeCoverages.map((coverage, index) => (
          <motion.div
            key={`${coverage.type}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className="rounded-lg bg-bg-main p-3"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-text-primary">{coverage.name || coverage.type}</p>
              <span className="rounded-full bg-covered/10 px-2 py-0.5 text-xs text-covered">Active</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Limit: {coverage.limit || 'N/A'} | Deductible: {coverage.deductible || 'N/A'}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">{coverage.notes || coverage.details || 'No additional notes.'}</p>
          </motion.div>
        ))}
        {activeCoverages.length === 0 && (
          <p className="text-sm text-text-secondary">No active coverages were extracted from this policy.</p>
        )}
      </div>

      {uncoveredCoverages.length > 0 && (
        <>
          <h4 className="mb-2 text-sm font-heading font-semibold text-text-primary">Detected Gaps</h4>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {uncoveredCoverages.map((coverage, index) => (
              <span key={`${coverage.type}-${index}`} className="rounded-full bg-gap/10 px-2 py-1 text-xs text-gap">
                {coverage.name || coverage.type}
              </span>
            ))}
          </div>
        </>
      )}

      {summary.plainEnglishSummary && (
        <div className="rounded-lg bg-primary/5 p-3 text-sm text-text-primary">
          {summary.plainEnglishSummary}
        </div>
      )}
    </motion.div>
  );
}
