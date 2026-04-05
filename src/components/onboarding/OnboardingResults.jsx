import { useState } from 'react';
import { CheckCircle2, ChevronDown, Building2, Search, ListChecks, Lightbulb, AlertTriangle } from 'lucide-react';
import RippleButton from '../shared/RippleButton';
import OnboardingPlaidConnect from './OnboardingPlaidConnect';

const riskColor = {
  low: 'text-covered border-covered/30 bg-covered/10',
  medium: 'text-warning border-warning/30 bg-warning/10',
  high: 'text-gap border-gap/30 bg-gap/10',
};

export default function OnboardingResults({ result, onSave, formData }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState('entity');

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const handleSaveForPlaid = async () => {
    setSaving(true);
    try {
      await onSave(true); // skipOnboarding = true — stay on this page
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndGo = async () => {
    setSaving(true);
    try {
      await onSave(false); // complete onboarding — go to dashboard
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-background min-h-screen">
      <div className="animated-bg" />
      <div className="noise-overlay" />
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/5 px-4 py-5">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-xl font-heading font-light text-text-primary">
                Your plan for {result.businessProfile?.businessName || 'your business'}
              </h1>
            </div>
            <p className="ml-11 text-sm text-text-secondary">
              {result.formationChecklist?.length || 0} steps to launch · {result.complianceItems?.length || 0} compliance requirements
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
          {/* Urgent warnings */}
          {result.urgentWarnings?.length > 0 && (
            <div className="rounded-[20px] border border-warning/20 bg-warning/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertTriangle className="h-4 w-4" /> Important heads-up
              </p>
              <ul className="mt-2 space-y-1">
                {result.urgentWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-warning/80">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Entity recommendation */}
          <Accordion
            id="entity"
            expanded={expanded}
            toggle={toggle}
            icon={<Building2 className="h-5 w-5 text-primary" />}
            title={`Recommended: ${(result.entityRecommendation?.recommended || 'LLC').replace('_', ' ').toUpperCase()}`}
            subtitle={`Filing cost: $${result.entityRecommendation?.filingCost || 0} · ${result.entityRecommendation?.processingTime || 'Varies'}`}
          >
            <p className="mt-3 text-sm leading-6 text-text-secondary">{result.entityRecommendation?.reasoning}</p>
            {result.entityRecommendation?.alternativeConsiderations && (
              <p className="mt-2 text-xs text-text-secondary/70">{result.entityRecommendation.alternativeConsiderations}</p>
            )}
            {result.entityRecommendation?.filingUrl && (
              <a href={result.entityRecommendation.filingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                File online →
              </a>
            )}
          </Accordion>

          {/* Name analysis */}
          {result.nameAnalysis?.name && (
            <Accordion
              id="name"
              expanded={expanded}
              toggle={toggle}
              icon={<Search className="h-5 w-5 text-primary" />}
              title={`Name: "${result.nameAnalysis.name}"`}
              subtitle={<>Trademark risk: <span className={riskColor[result.nameAnalysis.trademarkRisk] || ''}>{result.nameAnalysis.trademarkRisk}</span></>}
            >
              <div className="mt-3 flex gap-4 text-sm">
                <span className={result.nameAnalysis.available ? 'text-covered' : 'text-gap'}>
                  {result.nameAnalysis.available ? '✓' : '✗'} Entity name available
                </span>
                <span className={result.nameAnalysis.domainAvailable ? 'text-covered' : 'text-gap'}>
                  {result.nameAnalysis.domainAvailable ? '✓' : '✗'} .com domain
                </span>
              </div>
              {result.nameAnalysis.suggestions?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-text-secondary">Alternative suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.nameAnalysis.suggestions.map((s, i) => (
                      <span key={i} className="surface-chip rounded-md px-2 py-1 text-xs text-text-secondary">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </Accordion>
          )}

          {/* Formation checklist */}
          <Accordion
            id="checklist"
            expanded={expanded}
            toggle={toggle}
            icon={<ListChecks className="h-5 w-5 text-primary" />}
            title="Formation checklist"
            subtitle={`${result.formationChecklist?.length || 0} steps to legally launch`}
          >
            <div className="divide-y divide-white/5">
              {(result.formationChecklist || []).map((item, i) => (
                <div key={item.id || i} className="flex gap-3 py-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-text-secondary">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary/70">
                      <span>{item.estimatedTime}</span>
                      {item.estimatedCost > 0 && <span>${item.estimatedCost}</span>}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link →</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Key insights */}
          {result.keyInsights?.length > 0 && (
            <div className="rounded-[20px] border border-primary/15 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Lightbulb className="h-4 w-4" /> Key insights for your business
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-primary/80">• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bank connection — PRIMARY CTA */}
          {saved ? (
            <OnboardingPlaidConnect />
          ) : (
            <div className="glass-card rounded-[24px] p-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <p className="text-sm font-medium text-text-primary">Connect your bank for live financial insights</p>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Automatically track income, expenses, and deductions. Your plan updates in real-time as your business grows.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <RippleButton variant="primary" size="lg" className="w-full" onClick={handleSaveForPlaid} disabled={saving}>
                  {saving ? 'Saving...' : 'Save plan & connect bank'}
                </RippleButton>
                <button
                  type="button"
                  onClick={handleSaveAndGo}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-white/5"
                >
                  {saving ? 'Saving...' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}

          {/* After Plaid connect, show a go-to-dashboard button */}
          {saved && (
            <div className="pb-8 pt-2">
              <RippleButton variant="secondary" size="lg" className="w-full" onClick={handleSaveAndGo} disabled={saving}>
                Continue to dashboard
              </RippleButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Accordion({ id, expanded, toggle, icon, title, subtitle, children }) {
  const isOpen = expanded === id;
  return (
    <div className="glass-card overflow-hidden rounded-[20px]">
      <button type="button" onClick={() => toggle(id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-sm font-medium text-text-primary">{title}</p>
            <p className="text-xs text-text-secondary">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-white/5 px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  );
}
