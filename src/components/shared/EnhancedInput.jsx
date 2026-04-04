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
        <label className="block text-sm font-medium text-text-secondary mb-2">
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
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: isFocused
              ? '0 0 0 3px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.3)'
              : '0 0 0 0px rgba(6, 182, 212, 0)',
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
          className={`
            w-full px-4 py-3 rounded-lg
            bg-white/5 backdrop-blur-sm
            border border-white/10
            text-text-primary placeholder-text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary focus:bg-white/8
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-gap' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          className="mt-1.5 text-xs text-gap"
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
