const STATUS_STYLES = {
  covered: 'bg-covered/10 text-covered',
  underinsured: 'bg-underinsured/10 text-underinsured',
  gap: 'bg-gap/10 text-gap',
};

const DEFAULT_LABELS = {
  covered: 'Covered',
  underinsured: 'Underinsured',
  gap: 'Gap',
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.gap}`}>
      {label || DEFAULT_LABELS[status] || status}
    </span>
  );
}
