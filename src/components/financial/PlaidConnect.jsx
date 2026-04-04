import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Landmark, Loader2, ShieldCheck, X } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import {
  clearPendingPlaidSession,
  clearStoredPlaidLinkToken,
  consumePlaidResumeResult,
  getPlaidRedirectUri,
  getStoredPlaidFormData,
  getStoredPlaidPreparedSession,
  rememberPendingPlaidSession,
  storePlaidPreparedSession,
  storePlaidLinkToken,
} from '../../services/plaidSession';
import RippleButton from '../shared/RippleButton';

function getPlaidErrorMessage(error, fallbackMessage) {
  return (
    error?.display_message ||
    error?.error_message ||
    error?.message ||
    fallbackMessage
  );
}

function getLaunchStatusCopy(status) {
  switch (status) {
    case 'preparing':
      return 'Preparing your business context and secure Plaid session.';
    case 'ready':
      return 'Your secure Plaid window is ready. Launch it from this modal.';
    case 'opening':
      return 'Opening Plaid Link.';
    case 'connecting':
      return 'Continue in Plaid to link your bank account.';
    case 'finalizing':
      return 'Finalizing the account connection and loading live balances.';
    case 'resuming':
      return 'Resuming your Plaid connection after the bank handoff.';
    default:
      return 'Launch Plaid from here so the secure flow stays tied to onboarding.';
  }
}

function getEventStatus(eventName) {
  switch (eventName) {
    case 'OPEN':
      return 'connecting';
    case 'HANDOFF':
      return 'connecting';
    case 'SELECT_INSTITUTION':
      return 'connecting';
    case 'SUBMIT_CREDENTIALS':
      return 'connecting';
    default:
      return null;
  }
}

function PlaidLaunchModal({
  open,
  ready,
  isPreparing,
  status,
  error,
  onClose,
  onLaunch,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-card w-full max-w-xl p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="surface-panel flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Landmark className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-text-primary">Connect with Plaid</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Securely launch your bank connection from inside onboarding.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="surface-chip focus-ring-brand inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:text-text-primary"
                aria-label="Close Plaid launcher"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="surface-panel rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
                {isPreparing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-covered" />
                )}
                Secure bank connection
              </div>

              <p className="text-sm text-text-secondary">
                {getLaunchStatusCopy(status)}
              </p>

              <div className="mt-4 grid gap-2 text-xs text-text-secondary sm:grid-cols-3">
                <div className="surface-chip rounded-xl px-3 py-2">
                  1. Validate profile
                </div>
                <div className="surface-chip rounded-xl px-3 py-2">
                  2. Open Plaid Link
                </div>
                <div className="surface-chip rounded-xl px-3 py-2">
                  3. Load live balances
                </div>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-gap/30 bg-gap/10 px-3 py-2 text-xs text-gap">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <RippleButton type="button" variant="secondary" onClick={onClose}>
                Not now
              </RippleButton>
              <RippleButton
                type="button"
                variant="primary"
                onClick={onLaunch}
                disabled={!ready || isPreparing}
                icon={isPreparing ? Loader2 : ArrowRight}
              >
                {isPreparing ? 'Preparing secure window...' : 'Open Plaid Secure Window'}
              </RippleButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function PlaidConnect({
  formData,
  disabled = false,
  className = '',
  validateForm = () => true,
  isFormReady = false,
}) {
  const {
    loading,
    plaidConnected,
    setPlaidConnected,
    loadPlaidData,
    preparePlaidOnboarding,
  } = useContext(AppContext);
  const preparedSessionRef = useRef(null);
  const prefetchedTokenRef = useRef(false);
  const [linkToken, setLinkToken] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState('');
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launchStatus, setLaunchStatus] = useState('idle');

  const fetchLinkToken = useCallback(async () => {
    const data = await api.createPlaidLinkToken({
      redirectUri: getPlaidRedirectUri(),
    });

    if (!data.link_token) {
      throw new Error('Could not create a Plaid link token.');
    }

    setLinkToken(data.link_token);
    return data.link_token;
  }, []);

  useEffect(() => {
    if (!isFormReady || plaidConnected || linkToken || prefetchedTokenRef.current) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      prefetchedTokenRef.current = true;

      try {
        const nextToken = await fetchLinkToken();
        if (!active) {
          return;
        }

        setLinkToken(nextToken);
      } catch (nextError) {
        if (active) {
          prefetchedTokenRef.current = false;
        }

        console.warn('Plaid token prefetch failed:', nextError);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [fetchLinkToken, isFormReady, linkToken, plaidConnected]);

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setError('');
    setIsPreparing(true);
    setLaunchStatus('finalizing');

    try {
      await api.exchangePlaidToken({
        publicToken,
        institutionName: metadata?.institution?.name || null,
      });

      const connected = await loadPlaidData({
        completeOnboarding: true,
        sessionOverride: preparedSessionRef.current,
      });

      if (!connected) {
        setPlaidConnected(false);
        throw new Error('Plaid connected, but live account data is not available yet. Please try again.');
      }

      clearPendingPlaidSession();
      setLauncherOpen(false);
    } catch (nextError) {
      console.error('Plaid connection failed:', nextError);
      setPlaidConnected(false);
      setError(getPlaidErrorMessage(nextError, 'Failed to connect your account.'));
      setLaunchStatus('idle');
    } finally {
      clearStoredPlaidLinkToken();
      prefetchedTokenRef.current = false;
      setLinkToken(null);
      setIsPreparing(false);
    }
  }, [loadPlaidData, setPlaidConnected]);

  const onExit = useCallback((exitError) => {
    setLaunchStatus('idle');

    if (!exitError) {
      return;
    }

    if (exitError.error_code === 'INVALID_LINK_TOKEN') {
      clearStoredPlaidLinkToken();
      prefetchedTokenRef.current = false;
      setLinkToken(null);
    }

    setError(getPlaidErrorMessage(exitError, 'Plaid connection was cancelled.'));
  }, []);

  const onEvent = useCallback((eventName) => {
    const nextStatus = getEventStatus(eventName);
    if (nextStatus) {
      setLaunchStatus(nextStatus);
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
    onEvent,
  });

  const beginPlaidFlow = useCallback(async () => {
    if (disabled || isPreparing || loading) {
      return;
    }

    if (!validateForm()) {
      setLauncherOpen(true);
      setError('Complete your business profile above before connecting Plaid.');
      setLaunchStatus('idle');
      return;
    }

    setLauncherOpen(true);
    setError('');
    setIsPreparing(true);
    setLaunchStatus('preparing');

    try {
      rememberPendingPlaidSession(formData);
      preparedSessionRef.current = await preparePlaidOnboarding(formData);
      storePlaidPreparedSession(preparedSessionRef.current);

      const nextLinkToken = linkToken || await fetchLinkToken();
      storePlaidLinkToken(nextLinkToken);
      setLaunchStatus('ready');
    } catch (nextError) {
      console.error('Plaid preparation failed:', nextError);
      setError(getPlaidErrorMessage(nextError, 'Unable to start Plaid right now.'));
      setLaunchStatus('idle');
    } finally {
      setIsPreparing(false);
    }
  }, [disabled, fetchLinkToken, formData, isPreparing, linkToken, loading, preparePlaidOnboarding, validateForm]);

  const launchPlaidLink = useCallback(() => {
    if (!ready || !linkToken || isPreparing) {
      return;
    }

    setError('');
    setLaunchStatus('opening');
    open();
  }, [isPreparing, linkToken, open, ready]);

  useEffect(() => {
    const resume = consumePlaidResumeResult();

    if (!resume) {
      return undefined;
    }

    const pendingFormData = getStoredPlaidFormData();
    const storedPreparedSession = getStoredPlaidPreparedSession();
    if (!pendingFormData) {
      setError('Your Plaid session expired. Start the connection again.');
      clearPendingPlaidSession();
      return undefined;
    }

    let cancelled = false;
    setLauncherOpen(true);

    if (resume.status !== 'success') {
      setError(resume.message || 'Plaid connection was interrupted.');
      setLaunchStatus('idle');
      return undefined;
    }

    const resumePlaidFlow = async () => {
      setError('');
      setIsPreparing(true);
      setLaunchStatus('resuming');

      try {
        preparedSessionRef.current = storedPreparedSession || await preparePlaidOnboarding(pendingFormData);

        if (cancelled) {
          return;
        }

        const connected = await loadPlaidData({
          completeOnboarding: true,
          sessionOverride: preparedSessionRef.current,
        });

        if (cancelled) {
          return;
        }

        if (!connected) {
          throw new Error('Plaid connected, but live account data is not ready yet. Please try the connection again.');
        }

        clearPendingPlaidSession();
        clearStoredPlaidLinkToken();
        setLinkToken(null);
        setLauncherOpen(false);
      } catch (nextError) {
        console.error('Plaid resume failed:', nextError);
        setError(getPlaidErrorMessage(nextError, 'Failed to resume your Plaid connection.'));
        setLaunchStatus('idle');
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
        }
      }
    };

    void resumePlaidFlow();

    return () => {
      cancelled = true;
    };
  }, [loadPlaidData, preparePlaidOnboarding]);

  const closeLauncher = () => {
    setLauncherOpen(false);
    if (!isPreparing) {
      setLaunchStatus('idle');
    }
  };

  const isBusy = disabled || loading || isPreparing;
  const cardMessage = plaidConnected
    ? 'Live balances and transactions are connected through Plaid.'
    : linkToken
      ? 'Plaid is ready to open from inside onboarding.'
      : 'Link your business accounts during onboarding so live balances and transactions replace demo data.';

  return (
    <>
      <div className={`surface-panel rounded-2xl p-4 ${className}`}>
        <div className="mb-3 flex items-start gap-3">
          <div className="surface-chip mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl">
            {plaidConnected ? (
              <CheckCircle2 className="h-5 w-5 text-covered" />
            ) : (
              <Landmark className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {plaidConnected ? 'Plaid connected' : 'Connect with Plaid'}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {cardMessage}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mb-3 rounded-xl border border-gap/30 bg-gap/10 px-3 py-2 text-xs text-gap">
            {error}
          </p>
        ) : null}

        <RippleButton
          type="button"
          onClick={() => {
            void beginPlaidFlow();
          }}
          disabled={isBusy}
          variant="primary"
          className="w-full"
          icon={isBusy ? Loader2 : Landmark}
        >
          {isPreparing
            ? 'Preparing secure window...'
            : plaidConnected
              ? 'Connected'
              : 'Connect Bank Account'}
        </RippleButton>
      </div>

      <PlaidLaunchModal
        open={launcherOpen}
        ready={ready}
        isPreparing={isPreparing}
        status={launchStatus}
        error={error}
        onClose={closeLauncher}
        onLaunch={launchPlaidLink}
      />
    </>
  );
}
