import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const PHASES = ['Now', 'This renewal cycle', 'After quote/agent review'];

export default function RiskTimeline({ items }) {
  const grouped = PHASES.map((phase) => ({
    phase,
    items: (items || []).filter((item) => item.executionPhase === phase),
  })).filter((section) => section.items.length > 0);

  if (!grouped.length) {
    return null;
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">
        Execution timeline
      </h3>

      <div className="grid gap-4 lg:grid-cols-3">
        {grouped.map((section, sectionIndex) => (
          <div key={section.phase} className="surface-panel rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">{section.phase}</p>
            <div className="mt-4 space-y-3">
              {section.items.map((item, itemIndex) => (
                <MotionDiv
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: sectionIndex * 0.08 + itemIndex * 0.06 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{item.gapName}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      +{item.scoreDelta}%
                    </span>
                  </div>
                </MotionDiv>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
