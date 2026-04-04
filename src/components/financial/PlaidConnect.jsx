import { useState, useCallback, useContext } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function PlaidConnect() {
  const { plaidConnected, setPlaidConnected, loadPlaidData } = useContext(AppContext);
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createLinkToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/plaid/create-link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'default-user' }),
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setError('Could not create link token');
      }
    } catch {
      setError('Server not reachable. Make sure the Express server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSuccess = useCallback(async (publicToken, metadata) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/plaid/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          user_id: 'default-user',
          institution_name: metadata?.institution?.name || null,
        }),
      });
      setPlaidConnected(true);
      await loadPlaidData();
    } catch {
      setError('Failed to connect account');
    } finally {
      setLoading(false);
    }
  }, [setPlaidConnected, loadPlaidData]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  });

  // Auto-open Plaid Link when token is ready
  if (linkToken && ready) {
    open();
  }

  if (plaidConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-covered/10 border border-covered/30 rounded-xl p-4 flex items-center gap-3"
      >
        <CheckCircle className="w-5 h-5 text-covered flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">Bank account connected</p>
          <p className="text-xs text-text-secondary">Live data from Plaid</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">Connect Your Bank</h3>
          <p className="text-sm text-text-secondary">Link your business accounts for real-time financial data</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gap mb-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={createLinkToken}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        {loading ? 'Connecting...' : 'Connect with Plaid'}
      </button>
    </div>
  );
}
