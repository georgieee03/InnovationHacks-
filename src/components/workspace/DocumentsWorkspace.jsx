import { useContext, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Camera, FileSignature, Send } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import ComplianceWorkspace from './ComplianceWorkspace';
import ContractsWorkspace from './ContractsWorkspace';
import QuotesWorkspace from './QuotesWorkspace';
import ReceiptsWorkspace from './ReceiptsWorkspace';

const MotionDiv = motion.div;

const SURFACES = [
  {
    id: 'contracts',
    label: 'Contracts',
    description: 'Signed work and renewals',
    icon: FileSignature,
    colorClass: 'text-blue-300',
    activeClass: 'bg-blue-500/12 border-blue-400/25 text-blue-200',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    description: 'Pricing and pipeline',
    icon: Send,
    colorClass: 'text-violet-300',
    activeClass: 'bg-violet-500/12 border-violet-400/25 text-violet-200',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    description: 'Spend and deductions',
    icon: Camera,
    colorClass: 'text-emerald-300',
    activeClass: 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Licenses and obligations',
    icon: BadgeCheck,
    colorClass: 'text-amber-300',
    activeClass: 'bg-amber-500/12 border-amber-400/25 text-amber-200',
  },
];

const SURFACE_COMPONENTS = {
  contracts: ContractsWorkspace,
  quotes: QuotesWorkspace,
  receipts: ReceiptsWorkspace,
  compliance: ComplianceWorkspace,
};

export default function DocumentsWorkspace() {
  const { documentsSubview, setDocumentsSubview } = useContext(AppContext);

  const activeSurface = useMemo(() => (
    SURFACES.find((surface) => surface.id === documentsSubview) || SURFACES[0]
  ), [documentsSubview]);
  const ActiveComponent = SURFACE_COMPONENTS[activeSurface.id];

  return (
    <section className="space-y-5">
      <div className="surface-panel rounded-[26px] p-2.5">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {SURFACES.map((surface) => {
            const Icon = surface.icon;
            const isActive = surface.id === activeSurface.id;

            return (
              <button
                key={surface.id}
                type="button"
                onClick={() => setDocumentsSubview(surface.id)}
                className={`group relative flex items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition-all duration-200 ${
                  isActive
                    ? `${surface.activeClass} shadow-[0_18px_40px_rgba(0,0,0,0.18)]`
                    : 'border-white/8 bg-white/[0.02] text-text-secondary hover:border-white/14 hover:bg-white/[0.045] hover:text-text-primary'
                }`}
              >
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${
                  isActive ? 'border-white/12 bg-white/[0.09]' : 'border-white/8 bg-white/[0.04]'
                }`}>
                  <Icon className={`h-4.5 w-4.5 ${isActive ? surface.colorClass : 'text-text-secondary group-hover:text-text-primary'}`} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">{surface.label}</p>
                  <p className={`mt-1 text-xs ${isActive ? 'text-white/68' : 'text-text-secondary'}`}>
                    {surface.description}
                  </p>
                </div>

                {isActive ? (
                  <motion.span
                    layoutId="documents-surface-indicator"
                    className="absolute inset-y-3 right-3 w-1 rounded-full bg-primary/90 shadow-[0_0_18px_rgba(0,207,49,0.45)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <MotionDiv
          key={activeSurface.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <ActiveComponent />
        </MotionDiv>
      </AnimatePresence>
    </section>
  );
}
