import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

/**
 * Getting Started checklist — shown on the dashboard until all steps are done.
 * Adapts the Next.js version to use AppContext + navigateToTab instead of Next router.
 */
export default function GettingStartedChecklist({ contracts, receipts, quotes, complianceItems }) {
  const { navigateToTab, plaidConnected } = useContext(AppContext);

  const items = [
    {
      id: 'contract',
      label: 'Upload your first contract',
      description: 'Get a plain-English breakdown of any agreement',
      tab: 'contracts',
      done: contracts.length > 0,
    },
    {
      id: 'receipt',
      label: 'Scan a receipt',
      description: 'Auto-categorize expenses and flag tax deductions',
      tab: 'receipts',
      done: receipts.length > 0,
    },
    {
      id: 'quote',
      label: 'Create a quote',
      description: 'Send professional quotes and track your pipeline',
      tab: 'quotes',
      done: quotes.length > 0,
    },
    {
      id: 'compliance',
      label: 'Review your compliance items',
      description: 'Make sure licenses and permits are on track',
      tab: 'compliance',
      done: complianceItems.some((c) => c.status !== 'not_started'),
    },
    {
      id: 'bank',
      label: 'Connect your bank account',
      description: 'Unlock cash flow tracking and smarter tax insights',
      tab: 'financial',
      done: plaidConnected,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;

  return (
    <div className="surface-panel rounded-[24px] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Getting started</p>
          <p className="text-xs text-text-secondary mt-0.5">{completed} of {items.length} complete</p>
        </div>
        <div className="flex items-center gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`w-2 h-2 rounded-full transition-colors ${item.done ? 'bg-covered' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigateToTab(item.tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
              item.done ? 'opacity-50' : 'hover:bg-white/5'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              item.done ? 'border-covered bg-covered' : 'border-white/20'
            }`}>
              {item.done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                {item.label}
              </p>
              {!item.done && (
                <p className="text-xs text-text-secondary">{item.description}</p>
              )}
            </div>
            {!item.done && (
              <svg className="w-4 h-4 text-text-secondary/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
