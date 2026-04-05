import { useState } from 'react';
import { motion } from 'framer-motion';

export default function EnhancedInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-2.5 block text-[0.76rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          animate={{
            boxShadow: isFocused
              ? '0 0 0 3px rgba(0, 207, 49, 0.22), 0 0 20px rgba(0, 207, 49, 0.32)'
              : '0 0 0 0px rgba(0, 207, 49, 0)',
          }}
          transition={{ duration: 0.2 }}
        />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={error ? { '--control-input-border-color': 'var(--color-danger)' } : undefined}
          className={`
            control-input focus-ring-brand w-full rounded-xl px-4 py-3.5
            text-[0.98rem] tracking-[-0.014em] text-text-primary placeholder-text-muted
            transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-gap' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          className="mt-2 text-[0.82rem] text-gap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
