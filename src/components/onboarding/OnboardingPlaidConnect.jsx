/**
 * Simplified Plaid connect for the onboarding results page.
 * Unlike the full PlaidConnect component, this one does NOT call
 * preparePlaidOnboarding (which resets app state and causes re-renders).
 * It just creates a link token, opens Plaid Link, exchanges the token,
 * and loads the data.
 */
import { useCallback, useContext, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { CheckCircle2, Landmark, Loader2 } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import RippleButton from '../shared/RippleButton';

export default function OnboardingPlaidConnect() {
  const { authUser, loadPlaidData } = useContext(AppContext);
  const [linkToken, setLinkToken] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | fetching | ready | connecting | done | error
  const [error, setError] = useState('');

  const fetchToken = useCallback(async () => {
    setStatus('fetching');
    setError('');
    try {
      const data = await api.createPlaidLinkToken({
        userId: authUser?.auth0Id || '',
      });
      if (!data.link_token) throw new Error('No link token returned');
      setLinkToken(data.link_token);
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'Failed to create Plaid session');
      setStatus('error');
    }
  }, [authUser?.auth0Id]);

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setStatus('connecting');
    setError('');
    try {
      await api.exchangePlaidToken({
        publicToken,
        userId: authUser?.auth0Id || '',
        institutionName: metadata?.institution?.name || null,
      });

      // Load the Plaid data into app state
      await loadPlaidData({ completeOnboarding: false });
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Failed to connect bank');
      setStatus('error');
    }
  }, [authUser?.auth0Id, loadPlaidData]);

  const onExit = useCallback((exitError) => {
    if (exitError) {
      setError(exitError.display_message || exitError.error_message || 'Plaid was closed');
      setStatus('error');
    } else {
      // User closed without error — just go back to ready
      if (status === 'connecting') setStatus('ready');
    }
  }, [status]);

  const { open, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const handleClick = useCallback(async () => {
    if (status === 'done') return;

    if (!linkToken) {
      await fetchToken();
      return;
    }

    if (plaidReady) {
      setStatus('connecting');
      open();
    }
  }, [fetchToken, linkToken, open, plaidReady, status]);

  // Auto-open Plaid once token is ready
  if (status === 'ready' && plaidReady && linkToken) {
    // Small delay to let the button render, then auto-open
    setTimeout(() => {
      setStatus('connecting');
      open();
    }, 300);
  }

  if (status === 'done') {
    return (
      <div className="surface-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-covered" />
          <div>
            <p className="text-sm font-medium text-text-primary">Bank connected</p>
            <p className="mt-1 text-xs text-text-secondary">Live balances and transactions are now linked.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-2xl p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="surface-chip mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl">
          <Landmark className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">Connect with Plaid</p>
          <p className="mt-1 text-xs text-text-secondary">
            Link your business bank account for live balances and transaction tracking.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-gap/30 bg-gap/10 px-3 py-2 text-xs text-gap">
          {error}
        </p>
      )}

      <RippleButton
        type="button"
        variant="primary"
        className="w-full"
        onClick={handleClick}
        disabled={status === 'fetching' || status === 'connecting'}
      >
        {status === 'fetching' ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing secure session...</>
        ) : status === 'connecting' ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
        ) : status === 'error' ? (
          'Try again'
        ) : (
          'Connect Bank Account'
        )}
      </RippleButton>
    </div>
  );
}
