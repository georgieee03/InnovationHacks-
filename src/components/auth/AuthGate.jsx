import { ShieldCheck, LockKeyhole, ArrowRight } from 'lucide-react';
import RippleButton from '../shared/RippleButton';

export default function AuthGate({ loginUrl }) {
  return (
    <div className="app-background min-h-screen">
      <div className="animated-bg" />
      <div className="noise-overlay" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass-card w-full max-w-3xl rounded-[32px] p-8 shadow-2xl sm:p-10">
          <div className="flex items-start gap-4">
            <div className="surface-panel flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-text-secondary">Protected workspace</p>
              <h1 className="mt-2 text-4xl font-heading font-thin tracking-[-0.04em] text-text-primary sm:text-5xl">
                Sign in to access the merged SafeGuard workspace
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
                Auth0 is now the entry point for this branch. After login, SafeGuard onboarding becomes the shared business profile for contracts, receipts, compliance, quotes, and growth planning.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="surface-panel rounded-3xl p-5">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-text-primary">Auth0 session</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Production access is tied to your Auth0 identity and the current SafeGuard Vercel URL.</p>
            </div>
            <div className="surface-panel rounded-3xl p-5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-text-primary">SafeGuard onboarding</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">The original SafeGuard onboarding flow replaces LaunchPad&apos;s questionnaire and seeds the full workspace.</p>
            </div>
            <div className="surface-panel rounded-3xl p-5">
              <ArrowRight className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-text-primary">LaunchPad workflows</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Contracts, receipts, quotes, compliance, and growth all stay inside the existing SafeGuard shell.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <RippleButton
              variant="primary"
              size="lg"
              className="min-w-[220px]"
              onClick={() => {
                window.location.href = loginUrl;
              }}
            >
              Continue with Auth0
            </RippleButton>
            <a href={loginUrl} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
              Direct login route
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
