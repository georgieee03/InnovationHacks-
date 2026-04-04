const SIZE_CLASSES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const COLOR_VARIANTS = {
  primary: 'text-reflective-primary',
  success: 'text-reflective-success',
  warning: 'text-reflective-warning',
  danger: 'text-reflective-danger',
  neutral: 'text-reflective-neutral',
};

export default function StatValue({ value, color = 'neutral', size = 'lg', reflective = true, className = '' }) {
  const colorClass = COLOR_VARIANTS[color] || COLOR_VARIANTS.neutral;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.lg;

  if (!reflective) {
    return <span className={`inline-block font-heading font-light tracking-[-0.03em] text-text-primary ${sizeClass} ${className}`}>{value}</span>;
  }

  return (
    <span className={`text-reflective reflective-hover inline-block font-heading font-light leading-none tracking-[-0.04em] ${colorClass} ${sizeClass} ${className}`} data-value={value}>
      {value}
    </span>
  );
}
