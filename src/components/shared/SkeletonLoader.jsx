import React from 'react';

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
      <div className="skeleton h-5 w-1/3 mb-4" />
      <SkeletonText lines={3} />
      <div className="skeleton h-10 w-full mt-4" />
    </div>
  );
}

export function SkeletonChart({ className = '', height = 200 }) {
  return (
    <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
      <div className="skeleton h-5 w-1/4 mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {[40, 65, 50, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
          <div
            key={i}
            className="skeleton flex-1 rounded-t-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
      <div className="skeleton h-5 w-1/4 mb-4" />
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton h-4 flex-1" />
          ))}
        </div>
        <div className="border-t border-gray-100" />
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton h-4 flex-1 opacity-70" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
