/**
 * DocumentsWorkspace — Clean surface selector for Contracts, Quotes, Receipts, Compliance.
 * Each surface is immediately accessible with no unlock gating.
 * Uses existing standalone workspace components for the polished layouts.
 */
import { useContext } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Send, Camera, BadgeCheck } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import ContractsWorkspace from './ContractsWorkspace';
import QuotesWorkspace from './QuotesWorkspace';
import ReceiptsWorkspace from './ReceiptsWorkspace';
import ComplianceWorkspace from './ComplianceWorkspace';

const TABS = [
  {
    id: 'contracts',
    label: 'Contracts',
    icon: FileSignature,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    hoverBg: 'hover:bg-blue-500/8 hover:border-blue-500/20 hover:text-blue-300',
    dotColor: 'bg-blue-400',
    description: 'Agreements & legal docs',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: Send,
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
    hoverBg: 'hover:bg-violet-500/8 hover:border-violet-500/20 hover:text-violet-300',
    dotColor: 'bg-violet-400',
    description: 'Client pricing & pipeline',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: Camera,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    hoverBg: 'hover:bg-emerald-500/8 hover:border-emerald-500/20 hover:text-emerald-300',
    dotColor: 'bg-emerald-400',
    description: 'Expenses & deductions',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: BadgeCheck,
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    hoverBg: 'hover:bg-amber-500/8 hover:border-amber-500/20 hover:text-amber-300',
    dotColor: 'bg-amber-400',
    description: 'Licenses & obligations',
  },
];

export default function DocumentsWorkspace() {
  const { documentsSubview, setDocumentsSubview } = useContext(AppContext);

  const activeTab = TABS.find(t => t.id === documentsSubview) || TABS[0];

  return (
    <section className="space-y-5">
      {/* Surface selector - clean tabs without locks */}
      <div className="surface-panel rounded-[24px] p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = documentsSubview === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDocumentsSubview(tab.id)}
                className={`
                  relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3
                  text-center transition-all duration-200 select-none cursor-pointer
                  ${isActive
                    ? `${tab.activeBg} shadow-sm`
                    : `border-white/5 text-text-secondary ${tab.hoverBg}`
                  }
                `}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-white/10' : 'bg-white/[0.04]'
                }`}>
                  <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                </div>

                <span className={`text-xs font-semibold tracking-wide`}>
                  {tab.label}
                </span>
                <span className={`text-[10px] leading-tight hidden sm:block ${isActive ? 'opacity-70' : 'opacity-40'}`}>
                  {tab.description}
                </span>

                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="documents-tab-indicator"
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full ${tab.dotColor}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace content - full-width standalone components */}
      <motion.div
        key={documentsSubview}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        {documentsSubview === 'contracts' && <ContractsWorkspace />}
        {documentsSubview === 'quotes' && <QuotesWorkspace />}
        {documentsSubview === 'receipts' && <ReceiptsWorkspace />}
        {documentsSubview === 'compliance' && <ComplianceWorkspace />}
      </motion.div>
    </section>
  );
}
