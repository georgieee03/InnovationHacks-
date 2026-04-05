import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { Loader2, Landmark } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import './index.css';
import AmbientBackground from './components/shared/AmbientBackground';
import { api } from './services/apiClient';
import {
  clearStoredPlaidLinkToken,
  getPlaidReturnPath,
  getStoredPlaidLinkToken,
  setPlaidResumeResult,
} from './services/plaidSession';

function finishResume(result) {
  setPlaidResumeResult(result);
  window.location.replace(getPlaidReturnPath());
}

function PlaidOAuthResume() {
  const [status, setStatus] = useState('Preparing to resume your secure Plaid connection.');
  const linkToken = getStoredPlaidLinkToken();

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setStatus('Finalizing your bank connection and returning to SafeGuard.');

    try {
      await api.exchangePlaidToken({
        publicToken,
        institutionName: metadata?.institution?.name || null,
      });

      clearStoredPlaidLinkToken();
      finishResume({ status: 'success' });
    } catch (error) {
      console.error('Plaid OAuth completion failed:', error);
      finishResume({
        status: 'error',
        message: error?.message || 'Plaid returned successfully, but SafeGuard could not finalize the connection.',
      });
    }
  }, []);

  const onExit = useCallback((error) => {
    clearStoredPlaidLinkToken();
    finishResume({
      status: 'error',
      message:
        error?.display_message ||
        error?.error_message ||
        error?.message ||
        'Plaid connection was cancelled before it could be completed.',
    });
  }, []);

  const { open, ready, error } = usePlaidLink({
    token: linkToken || null,
    receivedRedirectUri: window.location.href,
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (!linkToken) {
      finishResume({
        status: 'error',
        message: 'Your Plaid session expired before it could be resumed. Start the connection again.',
      });
    }
  }, [linkToken]);

  useEffect(() => {
    if (error) {
      console.error('Plaid OAuth resume error:', error);
      finishResume({
        status: 'error',
        message: error.message || 'SafeGuard could not resume the Plaid OAuth flow.',
      });
    }
  }, [error]);

  useEffect(() => {
    if (ready) {
      setStatus('Reopening Plaid to complete your bank connection.');
      open();
    }
  }, [open, ready]);

  return (
    <AmbientBackground className="min-h-screen">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="glass-card w-full max-w-md p-6 text-center shadow-2xl"
        >
          <div className="surface-panel mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-heading font-semibold text-text-primary">Returning to Plaid</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {status}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Secure OAuth handoff in progress
          </div>
        </motion.div>
      </div>
    </AmbientBackground>
  );
}

createRoot(document.getElementById('plaid-oauth-root')).render(
  <StrictMode>
    <PlaidOAuthResume />
  </StrictMode>
);
