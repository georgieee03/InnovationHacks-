import { useContext, useState } from 'react';
import { Landmark, Loader2, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';

const MotionDiv = motion.div;
import { api } from '../../services/apiClient';
import { usePlaidLink } from 'react-plaid-link';
import { getPlaidRedirectUri } from '../../services/plaidSession';

/**
 * Getting Started checklist — shown on the dashboard until all steps are done.
 * Includes compliance tasks from onboarding plan and inline Plaid popup.
 */
export default function GettingStartedChecklist({ contracts, receipts, quotes, complianceItems }) {
  const { navigateToTab, plaidConnected, loadPlaidData } = useContext(AppContext);
  const [plaidOpen, setPlaidOpen] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [plaidPreparing, setPlaidPreparing] = useState(false);
  const [plaidError, setPlaidError] = useState('');

  const criticalCompliance = complianceItems
    .filter(c => c.is_required && c.status === 'not_started')
    .slice(0, 3);

  const items = [
    {
      id: 'contract',
      label: 'Upload or generate your first contract',
      description: 'Get a plain-English breakdown of any agreement',
      tab: 'documents',
      done: contracts.length > 0,
      urgent: false,
    },
    {
      id: 'quote',
      label: 'Create a quote',
      description: 'Send professional quotes and track your pipeline',
      tab: 'documents',
      done: quotes.length > 0,
      urgent: false,
    },
    {
      id: 'receipt',
      label: 'Scan a receipt',
      description: 'Auto-categorize expenses and flag tax deductions',
      tab: 'documents',
      done: receipts.length > 0,
      urgent: false,
    },
    ...criticalCompliance.map(c => ({
      id: `compliance-${c.id}`,
      label: c.title,
      description: c.description,
      tab: 'documents',
      done: c.status === 'complete',
      urgent: true,
    })),
    {
      id: 'compliance',
      label: 'Review all compliance obligations',
      description: 'Make sure licenses and permits are on track',
      tab: 'documents',
      done: complianceItems.length > 0 && complianceItems.every(c => c.status !== 'not_started'),
      urgent: false,
    },
    {
      id: 'bank',
      label: 'Connect your bank account',
      description: 'Unlock cash flow tracking and smarter tax insights',
      tab: null,
      done: plaidConnected,
      urgent: false,
    },
  ];

  const completed = items.filter(i => i.done).length;
  if (completed === items.length) return null;

  const openPlaid = async () => {
    setPlaidOpen(true);
    setPlaidError('');
    if (linkToken) return;
    setPlaidPreparing(true);
    try {
      const data = await api.createPlaidLinkToken({ redirectUri: getPlaidRedirectUri() });
      if (!data.link_token) throw new Error('Could not create Plaid link token');
      setLinkToken(data.link_token);
    } catch (e) {
      setPlaidError(e.message || 'Failed to prepare Plaid');
    } finally {
      setPlaidPreparing(false);
    }
  };

  return (
    <>
      <div className="surface-panel rounded-[24px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Getting started</p>
            <p className="text-xs text-text-secondary mt-0.5">{completed} of {items.length} complete</p>
          </div>
          <div className="flex items-center gap-1.5">
            {items.map(item => (
              <div key={item.id} className={`w-2 h-2 rounded-full transition-colors ${item.done ? 'bg-covered' : item.urgent ? 'bg-warning' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.done) return;
                if (item.id === 'bank') {
                  openPlaid();
                  return;
                }
                navigateToTab(item.tab);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${item.done ? 'opacity-50' : 'hover:bg-white/5'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                item.done ? 'border-covered bg-covered' : item.urgent ? 'border-warning' : 'border-white/20'
              }`}>
                {item.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? 'text-text-secondary line-through' : item.urgent ? 'text-warning' : 'text-text-primary'}`}>
                  {item.urgent && !item.done && <span className="mr-1.5 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">Required</span>}
                  {item.label}
                </p>
                {!item.done && <p className="text-xs text-text-secondary">{item.description}</p>}
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

      <PlaidInlineModal
        open={plaidOpen}
        linkToken={linkToken}
        preparing={plaidPreparing}
        error={plaidError}
        onClose={() => setPlaidOpen(false)}
        onSuccess={async (publicToken, metadata) => {
          setPlaidPreparing(true);
          try {
            await api.exchangePlaidToken({ publicToken, institutionName: metadata?.institution?.name || null });
            await loadPlaidData({ completeOnboarding: false });
            setPlaidOpen(false);
          } catch (e) {
            setPlaidError(e.message || 'Connection failed');
          } finally {
            setPlaidPreparing(false);
          }
        }}
        onExit={() => setPlaidOpen(false)}
      />
    </>
  );
}

function PlaidInlineModal({ open, linkToken, preparing, error, onClose, onSuccess, onExit }) {
  const { open: openPlaidLink, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit,
  });

  return (
    <AnimatePresence>
      {open && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <MotionDiv
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-card w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="surface-panel flex h-11 w-11 items-center justify-center rounded-2xl">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Connect your bank</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Securely link accounts via Plaid to unlock live cash flow tracking.</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="surface-chip h-8 w-8 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="surface-panel rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                {preparing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <ShieldCheck className="h-4 w-4 text-covered" />}
                {preparing ? 'Preparing secure connection...' : 'Ready to connect'}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary">
                <div className="surface-chip rounded-xl px-2 py-1.5 text-center">1. Validate</div>
                <div className="surface-chip rounded-xl px-2 py-1.5 text-center">2. Link bank</div>
                <div className="surface-chip rounded-xl px-2 py-1.5 text-center">3. Sync data</div>
              </div>
            </div>

            {error && <p className="mb-4 rounded-xl border border-gap/30 bg-gap/10 px-3 py-2 text-xs text-gap">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-colors">Not now</button>
              <button
                type="button"
                onClick={() => {
                  if (ready && linkToken) openPlaidLink();
                }}
                disabled={!ready || preparing || !linkToken}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white bg-primary rounded-xl hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {preparing ? 'Preparing...' : 'Open Plaid'}
              </button>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
