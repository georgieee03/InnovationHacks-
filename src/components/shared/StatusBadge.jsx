const STATUS_STYLES = {
  covered: 'bg-covered/10 text-covered border-covered/30',
  underinsured: 'bg-underinsured/10 text-underinsured border-underinsured/30',
  gap: 'bg-gap/10 text-gap border-gap/30',
};

const DEFAULT_LABELS = {
  covered: 'Covered',
  underinsured: 'Underinsured',
  gap: 'Gap',
};

export default function StatusBadge({ status, label, pulse = false }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-300 ${STATUS_STYLES[status] || STATUS_STYLES.gap} ${pulse ? 'animate-pulse-subtle' : ''}`}>
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'covered' ? 'bg-covered' : status === 'underinsured' ? 'bg-underinsured' : 'bg-gap'} animate-ping-slow`} />
      )}
      {label || DEFAULT_LABELS[status] || status}
    </span>
  );
}
