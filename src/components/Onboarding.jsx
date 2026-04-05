import { useCallback, useContext, useEffect, useState } from 'react';
import {
  ArrowRight,
  FileSignature,
  Camera,
  Shield,
  BadgeDollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { api } from '../services/apiClient';
import { clearPendingPlaidSession, getStoredPlaidFormData } from '../services/plaidSession';
import OnboardingChat from './onboarding/OnboardingChat';
import OnboardingResults from './onboarding/OnboardingResults';
import LoadingSpinner from './shared/LoadingSpinner';
import RippleButton from './shared/RippleButton';

/**
 * Conversational AI onboarding — adapted from LaunchPad's flow into SafeGuard's UI.
 * Stages: intro → chat → processing → results
 */

export default function Onboarding({ previewOnly = false }) {
  const { onboard, loadPlaidData, loadDemo, authUser } = useContext(AppContext);
  const [stage, setStage] = useState('intro');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [derivedFormData, setDerivedFormData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for pending Plaid session on mount
  useEffect(() => {
    const pendingFormData = getStoredPlaidFormData();
    if (pendingFormData) {
      clearPendingPlaidSession();
      // Resume after Plaid OAuth — hydrate and complete
      onboard(pendingFormData).then((session) => {
        if (session) {
          loadPlaidData({ completeOnboarding: true, sessionOverride: session });
        }
      });
    }
  }, [onboard, loadPlaidData]);

  const handleChatComplete = useCallback(async (answers) => {
    setStage('processing');
    setError(null);

    try {
      const data = await api.businessAdvisor(answers);
      setResult(data);
      setStage('results');
    } catch (err) {
      setError(err.message || 'AI analysis failed');
      setStage('chat');
    }
  }, []);

  const handleSave = useCallback(async (skipOnboarding = false) => {
    if (!result?.businessProfile) return;

    const profile = result.businessProfile;
    const formData = {
      name: profile.businessName || 'My Business',
      type: profile.businessType || 'service',
      zip: profile.businessAddress?.zip || '',
      city: profile.businessAddress?.city || '',
      state: profile.businessAddress?.state || profile.entityState || '',
      monthlyRevenue: parseRevenueEstimate(result),
      employees: profile.employeeCount || 1,
    };

    setDerivedFormData(formData);

    if (skipOnboarding) {
      // Save business but don't complete onboarding — stay on results page for Plaid
      const session = await onboard(formData, { markOnboarded: false });
      setSavedSession(session);
    } else {
      // If already saved (business exists), just mark onboarded to go to dashboard
      if (savedSession) {
        await onboard(formData);
      } else {
        const session = await onboard(formData);
        setSavedSession(session);
      }
    }
  }, [result, onboard, savedSession]);

  const getFormData = useCallback(() => {
    if (derivedFormData) return derivedFormData;
    if (!result?.businessProfile) return null;
    const profile = result.businessProfile;
    return {
      name: profile.businessName || 'My Business',
      type: profile.businessType || 'service',
      zip: profile.businessAddress?.zip || '',
      city: profile.businessAddress?.city || '',
      state: profile.businessAddress?.state || profile.entityState || '',
      monthlyRevenue: parseRevenueEstimate(result),
      employees: profile.employeeCount || 1,
    };
  }, [derivedFormData, result]);

  const handleDemo = useCallback(async () => {
    setStage('processing');
    try {
      await loadDemo();
    } catch {
      setStage('intro');
    }
  }, [loadDemo]);

  // In previewOnly mode, lock to intro stage
  if (previewOnly && stage !== 'intro') {
    return null;
  }

  if (stage === 'processing') {
    return (
      <div className="app-background min-h-screen">
        <div className="animated-bg" />
        <div className="noise-overlay" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="glass-card w-full max-w-xl rounded-[28px] p-8">
            <LoadingSpinner message="Building your business plan..." />
            <div className="mt-6 space-y-2">
              {[
                'Checking entity requirements for your state',
                'Mapping compliance obligations',
                'Identifying licenses and permits',
                'Building your formation checklist',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'chat') {
    return <OnboardingChat onComplete={handleChatComplete} error={error} />;
  }

  if (stage === 'results' && result) {
    return (
      <OnboardingResults
        result={result}
        onSave={handleSave}
        formData={getFormData()}
      />
    );
  }

  // Intro stage
  const features = [
    { icon: <FileSignature className="h-5 w-5" />, title: 'Contract Analysis', desc: 'Upload any contract and get a plain-English breakdown of what it means and what to watch out for.', color: 'text-primary bg-primary/10' },
    { icon: <Camera className="h-5 w-5" />, title: 'Receipt Scanner', desc: 'Snap a photo of any receipt. We categorize it, flag tax deductions, and track spending automatically.', color: 'text-covered bg-covered/10' },
    { icon: <Shield className="h-5 w-5" />, title: 'Compliance Tracking', desc: 'We identify every license, permit, and filing your business needs — and remind you before deadlines.', color: 'text-primary bg-primary/10' },
    { icon: <BadgeDollarSign className="h-5 w-5" />, title: 'Tax Insights', desc: 'See estimated quarterly taxes, deduction opportunities, and what you should set aside.', color: 'text-warning bg-warning/10' },
    { icon: <TrendingUp className="h-5 w-5" />, title: 'Growth Tools', desc: 'Create professional quotes, discover funding, and get AI-powered suggestions to grow revenue.', color: 'text-primary bg-primary/10' },
  ];

  return (
    <div className="app-background min-h-screen">
      <div className="animated-bg" />
      <div className="noise-overlay" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">
              Your business, simplified
            </h1>
            <p className="mx-auto mt-2 max-w-md text-base text-text-secondary">
              Answer a few quick questions and we&apos;ll set up everything you need — no jargon, no guesswork.
            </p>
            {authUser?.name && (
              <p className="mt-2 text-sm text-text-secondary/60">
                Welcome, {authUser.name}
              </p>
            )}
          </div>

          {/* Feature cards */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="glass-card flex gap-3 rounded-xl p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <RippleButton 
              variant="primary" 
              size="lg" 
              className="min-w-[220px]" 
              onClick={() => {
                if (previewOnly) {
                  setShowAuthModal(true);
                } else {
                  setStage('chat');
                }
              }}
            >
              Let&apos;s get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </RippleButton>
            <p className="mt-3 text-sm text-text-secondary/60">Takes about 3 minutes · Just a conversation, no forms</p>
            {!previewOnly && (
              <button
                type="button"
                onClick={handleDemo}
                className="mt-4 text-sm text-text-secondary transition-colors hover:text-primary"
              >
                or load a demo workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseRevenueEstimate(result) {
  const est = result?.businessProfile?.estimatedRevenue || '';
  if (/over.*10/i.test(est)) return 12000;
  if (/5.*10/i.test(est)) return 7500;
  if (/2.*5/i.test(est)) return 3500;
  if (/under.*2/i.test(est)) return 1000;
  // Try to extract from service types
  const services = result?.businessProfile?.serviceTypes || [];
  const total = services.reduce((s, svc) => s + (svc.basePrice || 0), 0);
  return total || 3000;
}
