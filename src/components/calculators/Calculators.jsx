import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

const TABS = ['Emergency Fund', 'Business Interruption', 'Insurance Estimator'];

function PillTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-full w-fit mb-6">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            active === tab
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function EmergencyFundCalc() {
  const [monthly, setMonthly] = useState('');
  const [multiplier, setMultiplier] = useState(3);
  const [savings, setSavings] = useState('');

  const monthlyVal = parseFloat(monthly) || 0;
  const savingsVal = parseFloat(savings) || 0;
  const target = monthlyVal * multiplier;
  const gap = Math.max(0, target - savingsVal);
  const pct = target > 0 ? Math.min(100, (savingsVal / target) * 100) : 0;
  const need6 = gap > 0 ? gap / 6 : 0;
  const need12 = gap > 0 ? gap / 12 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Emergency Fund Calculator</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Monthly Expenses</label>
          <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Risk Multiplier</label>
          <select value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {[3, 4, 5, 6].map((m) => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Current Savings</label>
          <input type="number" value={savings} onChange={(e) => setSavings(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {monthlyVal > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Recommended Fund</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(target)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Current Gap</p>
              <p className="text-xl font-bold text-gap">{formatCurrency(gap)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Monthly to Save (6mo / 12mo)</p>
              <p className="text-lg font-bold text-covered">{formatCurrency(need6)} / {formatCurrency(need12)}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-3 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function BusinessInterruptionCalc() {
  const [revenue, setRevenue] = useState('');
  const [fixed, setFixed] = useState('');
  const [days, setDays] = useState('');

  const revVal = parseFloat(revenue) || 0;
  const fixVal = parseFloat(fixed) || 0;
  const daysVal = parseFloat(days) || 0;

  const dailyRevenue = revVal / 30;
  const dailyFixed = fixVal / 30;
  const revLost = dailyRevenue * daysVal;
  const fixedDuring = dailyFixed * daysVal;
  const totalImpact = revLost + fixedDuring;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Business Interruption Cost Calculator</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Monthly Revenue</label>
          <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Monthly Fixed Costs</label>
          <input type="number" value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Estimated Closure Days</label>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {daysVal > 0 && (revVal > 0 || fixVal > 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Revenue Lost</p>
              <p className="text-xl font-bold text-gap">{formatCurrency(revLost)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Fixed Costs During Closure</p>
              <p className="text-xl font-bold text-underinsured">{formatCurrency(fixedDuring)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Total Financial Impact</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalImpact)}</p>
            </div>
          </div>
          <div className="flex gap-1 h-6 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${totalImpact > 0 ? (revLost / totalImpact) * 100 : 0}%` }} transition={{ duration: 0.6 }} className="bg-gap" title="Revenue Lost" />
            <motion.div initial={{ width: 0 }} animate={{ width: `${totalImpact > 0 ? (fixedDuring / totalImpact) * 100 : 0}%` }} transition={{ duration: 0.6 }} className="bg-underinsured" title="Fixed Costs" />
          </div>
          <div className="flex gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gap inline-block" /> Revenue Lost</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-underinsured inline-block" /> Fixed Costs</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const TIERS = {
  restaurant: {
    essential: { range: [1800, 3200], includes: ['General Liability', 'Property Insurance', 'Workers Comp'] },
    recommended: { range: [3200, 5500], includes: ['General Liability', 'Property Insurance', 'Workers Comp', 'Business Interruption', 'Food Spoilage'] },
    comprehensive: { range: [5500, 9000], includes: ['General Liability', 'Property Insurance', 'Workers Comp', 'Business Interruption', 'Food Spoilage', 'Cyber Liability', 'Flood Insurance', 'Umbrella Policy'] },
  },
  retail: {
    essential: { range: [1200, 2400], includes: ['General Liability', 'Property Insurance', 'Workers Comp'] },
    recommended: { range: [2400, 4200], includes: ['General Liability', 'Property Insurance', 'Workers Comp', 'Business Interruption', 'Product Liability'] },
    comprehensive: { range: [4200, 7000], includes: ['General Liability', 'Property Insurance', 'Workers Comp', 'Business Interruption', 'Product Liability', 'Cyber Liability', 'Flood Insurance', 'Umbrella Policy'] },
  },
  salon: {
    essential: { range: [1000, 2000], includes: ['General Liability', 'Property Insurance', 'Professional Liability'] },
    recommended: { range: [2000, 3500], includes: ['General Liability', 'Property Insurance', 'Professional Liability', 'Workers Comp', 'Business Interruption'] },
    comprehensive: { range: [3500, 5500], includes: ['General Liability', 'Property Insurance', 'Professional Liability', 'Workers Comp', 'Business Interruption', 'Cyber Liability', 'Umbrella Policy'] },
  },
  contractor: {
    essential: { range: [2000, 3800], includes: ['General Liability', 'Workers Comp', 'Commercial Auto'] },
    recommended: { range: [3800, 6500], includes: ['General Liability', 'Workers Comp', 'Commercial Auto', 'Professional Liability', 'Tools & Equipment'] },
    comprehensive: { range: [6500, 10000], includes: ['General Liability', 'Workers Comp', 'Commercial Auto', 'Professional Liability', 'Tools & Equipment', 'Umbrella Policy', 'Cyber Liability'] },
  },
};

const TIER_LABELS = [
  { key: 'essential', label: 'Essential', color: 'bg-blue-50 border-blue-200' },
  { key: 'recommended', label: 'Recommended', color: 'bg-green-50 border-green-200' },
  { key: 'comprehensive', label: 'Comprehensive', color: 'bg-purple-50 border-purple-200' },
];

function InsuranceCostEstimator() {
  const [bizType, setBizType] = useState('restaurant');
  const [annualRev, setAnnualRev] = useState('');
  const [employees, setEmployees] = useState('');
  const [zip, setZip] = useState('');

  const revFactor = Math.max(1, (parseFloat(annualRev) || 100000) / 100000);
  const empFactor = Math.max(1, 1 + ((parseFloat(employees) || 1) - 1) * 0.1);
  const tiers = TIERS[bizType];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Insurance Cost Estimator</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Business Type</label>
          <select value={bizType} onChange={(e) => setBizType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="restaurant">Restaurant</option>
            <option value="retail">Retail</option>
            <option value="salon">Salon</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Annual Revenue</label>
          <input type="number" value={annualRev} onChange={(e) => setAnnualRev(e.target.value)} placeholder="100000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Employees</label>
          <input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} placeholder="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Zip Code</label>
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="77004" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIER_LABELS.map(({ key, label, color }) => {
          const tier = tiers[key];
          const low = Math.round(tier.range[0] * revFactor * empFactor);
          const high = Math.round(tier.range[1] * revFactor * empFactor);
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg border p-4 ${color}`}>
              <h4 className="font-semibold text-text-primary mb-2">{label}</h4>
              <p className="text-lg font-bold text-primary mb-3">{formatCurrency(low)} – {formatCurrency(high)}<span className="text-xs font-normal text-text-secondary"> /yr</span></p>
              <ul className="space-y-1">
                {tier.includes.map((item) => (
                  <li key={item} className="text-xs text-text-secondary flex items-center gap-1">
                    <span className="text-covered">✓</span> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function Calculators() {
  const [active, setActive] = useState(TABS[0]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Financial Calculators</h2>
      <p className="text-text-secondary text-sm mb-4">Plan ahead with interactive financial tools</p>
      <PillTabs active={active} onChange={setActive} />
      {active === 'Emergency Fund' && <EmergencyFundCalc />}
      {active === 'Business Interruption' && <BusinessInterruptionCalc />}
      {active === 'Insurance Estimator' && <InsuranceCostEstimator />}
    </div>
  );
}
