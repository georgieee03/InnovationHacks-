import { useContext, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, ShieldOff, ShieldCheck } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';

const SCENARIOS = [
  { id: 'flood', label: 'Flash Flood', impact: 45000, recovery: 30, coverageType: 'flood', icon: 'Flood' },
  { id: 'fire', label: 'Kitchen Fire', impact: 75000, recovery: 60, coverageType: 'commercial_property', icon: 'Fire' },
  { id: 'lawsuit', label: 'Slip & Fall Lawsuit', impact: 35000, recovery: 90, coverageType: 'general_liability', icon: 'Liability' },
  { id: 'equipment', label: 'Equipment Failure', impact: 8000, recovery: 14, coverageType: 'equipment_breakdown', icon: 'Equipment' },
  { id: 'databreach', label: 'Data Breach', impact: 50000, recovery: 45, coverageType: 'cyber_liability', icon: 'Cyber' },
  { id: 'injury', label: 'Employee Injury', impact: 25000, recovery: 30, coverageType: 'workers_comp', icon: 'Workers' },
];

function getGapItems(gapAnalysis) {
  if (Array.isArray(gapAnalysis)) {
    return gapAnalysis;
  }

  return gapAnalysis?.gaps ?? [];
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
}

function getCoverage(gapAnalysis, coverageType) {
  const gaps = getGapItems(gapAnalysis);
  const target = normalize(coverageType);
  const gap = gaps.find((item) => {
    const id = normalize(item.id);
    const name = normalize(item.name);
    return id === target || name.includes(target) || target.includes(id);
  });

  if (!gap) return 0;
  if (gap.status === 'covered') return 0.8;
  if (gap.status === 'underinsured') return 0.4;
  return 0;
}

export default function RiskSimulator() {
  const { gapAnalysis, financialMetrics } = useContext(AppContext);
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const scenario = useMemo(() => SCENARIOS.find((item) => item.id === selectedId) ?? SCENARIOS[0], [selectedId]);

  const coverageRatio = getCoverage(gapAnalysis, scenario.coverageType);
  const coveredAmount = Math.round(scenario.impact * coverageRatio);
  const outOfPocket = scenario.impact - coveredAmount;
  const coveredPct = (coveredAmount / scenario.impact) * 100;
  const uncoveredPct = 100 - coveredPct;
  const reserves = financialMetrics?.currentReserves || 0;
  const canCover = reserves >= outOfPocket;

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-text-primary">What-If Risk Simulator</h2>
      <p className="mb-6 text-sm text-text-secondary">See how different disaster scenarios would impact your business</p>

      <div className="mb-6">
        <label className="mb-2 block text-sm text-text-secondary">Select a scenario</label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`rounded-xl border-2 p-3 text-center text-sm font-medium transition ${selectedId === item.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-card text-text-secondary hover:border-gray-300'}`}
            >
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selectedId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-card p-5 shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gap" />
                <span className="text-sm text-text-secondary">Total Impact</span>
              </div>
              <p className="text-2xl font-bold text-gap">{formatCurrency(scenario.impact)}</p>
            </div>
            <div className="rounded-xl bg-card p-5 shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-covered" />
                <span className="text-sm text-text-secondary">Coverage Pays</span>
              </div>
              <p className="text-2xl font-bold text-covered">{formatCurrency(coveredAmount)}</p>
            </div>
            <div className="rounded-xl bg-card p-5 shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-underinsured" />
                <span className="text-sm text-text-secondary">Out of Pocket</span>
              </div>
              <p className="text-2xl font-bold text-underinsured">{formatCurrency(outOfPocket)}</p>
            </div>
            <div className="rounded-xl bg-card p-5 shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm text-text-secondary">Recovery Time</span>
              </div>
              <p className="text-2xl font-bold text-primary">{scenario.recovery} days</p>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-md">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Coverage Breakdown</h3>
            <div className="mb-3 flex h-8 overflow-hidden rounded-full">
              <motion.div initial={{ width: 0 }} animate={{ width: `${coveredPct}%` }} transition={{ duration: 0.6 }} className="flex items-center justify-center bg-covered text-xs font-medium text-white">
                {coveredPct > 10 && `${coveredPct.toFixed(0)}%`}
              </motion.div>
              <motion.div initial={{ width: 0 }} animate={{ width: `${uncoveredPct}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="flex items-center justify-center bg-gap text-xs font-medium text-white">
                {uncoveredPct > 10 && `${uncoveredPct.toFixed(0)}%`}
              </motion.div>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-covered" /> Covered: {formatCurrency(coveredAmount)}</span>
              <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-gap" /> Uncovered: {formatCurrency(outOfPocket)}</span>
            </div>

            {!getGapItems(gapAnalysis).length && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-underinsured">
                <AlertTriangle className="h-4 w-4" />
                No gap analysis found - showing default no-coverage values. Upload a policy to see personalized results.
              </div>
            )}

            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-text-secondary">
                Your current reserves: <span className="font-semibold text-text-primary">{formatCurrency(reserves)}</span>
                {' - '}
                {canCover
                  ? <span className="font-medium text-covered">Sufficient to cover out-of-pocket costs</span>
                  : <span className="font-medium text-gap">Short by {formatCurrency(outOfPocket - reserves)}</span>}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
