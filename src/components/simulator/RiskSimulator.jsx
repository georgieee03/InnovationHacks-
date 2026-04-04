import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, ShieldOff, ShieldCheck } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

const SCENARIOS = [
  { id: 'flood', label: 'Flash Flood', impact: 45000, recovery: 30, coverageType: 'flood', icon: '🌊' },
  { id: 'fire', label: 'Kitchen Fire', impact: 75000, recovery: 60, coverageType: 'fire', icon: '🔥' },
  { id: 'lawsuit', label: 'Slip & Fall Lawsuit', impact: 35000, recovery: 90, coverageType: 'liability', icon: '⚖️' },
  { id: 'equipment', label: 'Equipment Failure', impact: 8000, recovery: 14, coverageType: 'equipment', icon: '⚙️' },
  { id: 'databreach', label: 'Data Breach', impact: 50000, recovery: 45, coverageType: 'cyber', icon: '💻' },
  { id: 'injury', label: 'Employee Injury', impact: 25000, recovery: 30, coverageType: 'workers_comp', icon: '🏥' },
];

function getCoverage(gapAnalysis, coverageType) {
  if (!gapAnalysis?.gaps) return 0;
  const gap = gapAnalysis.gaps.find(
    (g) => g.type?.toLowerCase().includes(coverageType) || g.category?.toLowerCase().includes(coverageType)
  );
  if (gap && gap.status === 'covered') return 0.8;
  if (gap && gap.status === 'underinsured') return 0.4;
  return 0;
}

export default function RiskSimulator() {
  const { gapAnalysis, financialMetrics } = useContext(AppContext);
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === selectedId);

  const coverageRatio = getCoverage(gapAnalysis, scenario.coverageType);
  const coveredAmount = Math.round(scenario.impact * coverageRatio);
  const outOfPocket = scenario.impact - coveredAmount;
  const coveredPct = (coveredAmount / scenario.impact) * 100;
  const uncoveredPct = 100 - coveredPct;
  const reserves = financialMetrics?.currentReserves || 0;
  const canCover = reserves >= outOfPocket;

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">What-If Risk Simulator</h2>
      <p className="text-text-secondary text-sm mb-6">See how different disaster scenarios would impact your business</p>

      <div className="mb-6">
        <label className="block text-sm text-text-secondary mb-2">Select a scenario</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => setSelectedId(s.id)} className={`rounded-xl p-3 text-center border-2 transition text-sm font-medium ${selectedId === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-card text-text-secondary hover:border-gray-300'}`}>
              <span className="text-2xl block mb-1">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selectedId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-gap" />
                <span className="text-sm text-text-secondary">Total Impact</span>
              </div>
              <p className="text-2xl font-bold text-gap">{formatCurrency(scenario.impact)}</p>
            </div>
            <div className="bg-card rounded-xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-covered" />
                <span className="text-sm text-text-secondary">Coverage Pays</span>
              </div>
              <p className="text-2xl font-bold text-covered">{formatCurrency(coveredAmount)}</p>
            </div>
            <div className="bg-card rounded-xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldOff className="w-5 h-5 text-underinsured" />
                <span className="text-sm text-text-secondary">Out of Pocket</span>
              </div>
              <p className="text-2xl font-bold text-underinsured">{formatCurrency(outOfPocket)}</p>
            </div>
            <div className="bg-card rounded-xl shadow-md p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm text-text-secondary">Recovery Time</span>
              </div>
              <p className="text-2xl font-bold text-primary">{scenario.recovery} days</p>
            </div>
          </div>

          {/* Coverage Bar */}
          <div className="bg-card rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Coverage Breakdown</h3>
            <div className="flex h-8 rounded-full overflow-hidden mb-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${coveredPct}%` }} transition={{ duration: 0.6 }} className="bg-covered flex items-center justify-center text-white text-xs font-medium">
                {coveredPct > 10 && `${coveredPct.toFixed(0)}%`}
              </motion.div>
              <motion.div initial={{ width: 0 }} animate={{ width: `${uncoveredPct}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-gap flex items-center justify-center text-white text-xs font-medium">
                {uncoveredPct > 10 && `${uncoveredPct.toFixed(0)}%`}
              </motion.div>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-covered inline-block" /> Covered: {formatCurrency(coveredAmount)}</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gap inline-block" /> Uncovered: {formatCurrency(outOfPocket)}</span>
            </div>

            {!gapAnalysis && (
              <div className="mt-4 flex items-center gap-2 text-sm text-underinsured bg-yellow-50 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4" />
                No gap analysis found — showing default "no coverage" values. Upload a policy to see personalized results.
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-gray-50">
              <p className="text-sm text-text-secondary">
                Your current reserves: <span className="font-semibold text-text-primary">{formatCurrency(reserves)}</span>
                {' — '}
                {canCover
                  ? <span className="text-covered font-medium">Sufficient to cover out-of-pocket costs</span>
                  : <span className="text-gap font-medium">Short by {formatCurrency(outOfPocket - reserves)}</span>
                }
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
