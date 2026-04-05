import { motion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, CircleHelp, ShieldAlert, ShieldCheck } from 'lucide-react';

const MotionDiv = motion.div;

const PRIORITY_CONFIG = {
  critical: {
    icon: ShieldAlert,
    tone: 'text-gap',
    chip: 'bg-gap/10 text-gap border-gap/20',
    label: 'Critical',
  },
  recommended: {
    icon: AlertCircle,
    tone: 'text-warning',
    chip: 'bg-warning/10 text-warning border-warning/20',
    label: 'Recommended',
  },
  conditional: {
    icon: CircleHelp,
    tone: 'text-primary',
    chip: 'bg-primary/10 text-primary border-primary/20',
    label: 'Review',
  },
};

export default function RecommendationCard({ item, delay = 0 }) {
  const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.recommended;
  const Icon = config.icon;
  const hasOfficialSource = Boolean(item.officialSourceUrl);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card p-5"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 ${config.tone}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-heading text-xl font-light tracking-[-0.02em] text-text-primary">
                  {item.title}
                </h4>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${config.chip}`}>
                  {config.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{item.gapName}</p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Projected score gain</p>
              <p className="mt-1 text-lg font-medium text-primary">+{item.scoreDelta}%</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Recommended change</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">{item.recommendedChange}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Why this matters</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{item.whyThisMatters}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Fit rationale</p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{item.fitReason}</p>
              </div>
            </div>

            <div className="surface-panel rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>{item.carrierRecommendation}</span>
              </div>

              {hasOfficialSource ? (
                <a
                  href={item.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-80"
                >
                  Official source
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  Carrier-specific fit still needs agent confirmation.
                </p>
              )}

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Budget impact</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {String(item.budgetImpactSignal || 'unknown').replace(/^\w/, (char) => char.toUpperCase())}
                </p>
                <p className="mt-1 text-sm leading-6 text-text-secondary">{item.budgetImpactReason}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Implementation steps</p>
              <ul className="mt-2 space-y-2">
                {(item.implementationSteps || []).map((step) => (
                  <li key={step} className="surface-panel rounded-xl px-3 py-2 text-sm leading-6 text-text-primary">
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-secondary">Questions to ask your agent</p>
              <ul className="mt-2 space-y-2">
                {(item.agentQuestions || []).map((question) => (
                  <li key={question} className="surface-panel rounded-xl px-3 py-2 text-sm leading-6 text-text-secondary">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {item.notes ? (
            <p className="mt-4 text-sm text-text-secondary">
              Note: {item.notes}
            </p>
          ) : null}
        </div>
      </div>
    </MotionDiv>
  );
}
