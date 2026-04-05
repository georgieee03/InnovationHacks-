import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

/**
 * Auth gate — renders as a modal popup over the landing page.
 * Auto-opens on mount. User can dismiss to browse the landing page,
 * but clicking any CTA re-opens it.
 */
export default function AuthGate({ loginUrl, onOpenChange }) {
  const [open, setOpen] = useState(false);

  // Auto-open after a short delay so the landing page is visible first
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleLogin = () => {
    window.location.href = loginUrl;
  };

  return (
    <>
      {/* Floating sign-in button — always visible */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => handleOpenChange(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-primary backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          Sign in
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => handleOpenChange(false)}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card w-full max-w-md rounded-[28px] p-7 shadow-2xl pointer-events-auto">
                {/* Close */}
                <button
                  onClick={() => handleOpenChange(false)}
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon + heading */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-text-secondary">Welcome to SafeGuard</p>
                    <h2 className="text-xl font-heading font-light text-text-primary">Sign in to get started</h2>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-text-secondary mb-6">
                  Create your free account to access AI-powered contract analysis, receipt scanning, compliance tracking, tax insights, and growth tools — all in one place.
                </p>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  {[
                    'Personalized business plan in 3 minutes',
                    'Live financial insights via Plaid',
                    'AI-drafted contracts ready to sign',
                    'Compliance checklist built for your state',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <svg className="h-2.5 w-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
                >
                  Continue with Auth0
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-3 text-center text-xs text-text-secondary/50">
                  Free to use · No credit card required
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
