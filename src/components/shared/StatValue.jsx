import useTheme from '../../hooks/useTheme';

const SIZE_CLASSES = {
  sm: 'text-[1.35rem] md:text-[1.65rem]',
  md: 'text-[1.8rem] md:text-[2.2rem]',
  lg: 'text-[2.45rem] md:text-[3rem]',
  xl: 'text-[3.1rem] md:text-[3.9rem]',
};

const COLOR_VARIANTS = {
  primary: 'text-reflective-primary',
  success: 'text-reflective-success',
  warning: 'text-reflective-warning',
  danger: 'text-reflective-danger',
  neutral: 'text-reflective-neutral',
};

export default function StatValue({
  value,
  color = 'neutral',
  size = 'lg',
  reflective = true,
  className = '',
}) {
  const { theme } = useTheme();
  const colorClass = COLOR_VARIANTS[color] || COLOR_VARIANTS.neutral;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.lg;
  const shouldUseReflective = reflective && !(theme === 'light' && size === 'sm');
  const reflectiveModeClass = theme === 'light' ? 'reflective-force-dark-style' : '';

  if (!shouldUseReflective) {
    return (
      <span className={`inline-block font-heading font-normal leading-[0.96] tracking-[-0.03em] text-text-primary ${sizeClass} ${className}`}>
        {value}
      </span>
    );
  }

  return (
    <span
      className={`text-reflective reflective-hover inline-block font-heading font-normal leading-[0.92] tracking-[-0.035em] ${reflectiveModeClass} ${colorClass} ${sizeClass} ${className}`}
      data-value={value}
      data-size={size}
      data-tone={color}
    >
      {value}
    </span>
  );
}
