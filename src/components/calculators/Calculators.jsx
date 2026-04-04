import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import StatValue from '../shared/StatValue';

const TABS = [
  { id: 'emergency', label: 'Emergency Fund' },
  { id: 'interruption', label: 'Business Interruption' },
  { id: 'insurance', label: 'Insurance Estimator' },
];

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text-primary placeholder-text-muted transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

const TIER_STYLES = {
  essential: 'border-white/10 bg-white/5',
  recommended: 'border-primary/25 bg-primary/10',
  comprehensive: 'border-covered/25 bg-covered/10',
};

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
    recommended: { range: [3800, 6500], includes: ['General Liability', 'Workers Comp', 'Commercial Auto', 'Professional Liability', 'Tools and Equipment'] },
    comprehensive: { range: [6500, 10000], includes: ['General Liability', 'Workers Comp', 'Commercial Auto', 'Professional Liability', 'Tools and Equipment', 'Umbrella Policy', 'Cyber Liability'] },
  },
};

function PillTabs({ active, onChange }) {
  return (
    <div className="mb-6 inline-flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-sm font-normal tracking-[-0.01em] transition-all duration-200 ${
            active === tab.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CalculatorShell({ title, description, children }) {
  return (
    <section className="glass-card p-6 md:p-7">
      <div className="mb-6">
        <h3 className="text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm font-light text-text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ResultTile({ title, value, tone = 'neutral', helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">{title}</p>
      <div className="mt-3">
        <StatValue value={value} color={tone} size="md" />
      </div>
      {helper && <p className="mt-2 text-xs font-light text-text-secondary">{helper}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-normal text-text-secondary">{label}</label>
      {children}
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
    <CalculatorShell
      title="Emergency Fund Calculator"
      description="Estimate the reserve target you need to absorb a disruption and see how quickly you can close the gap."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Monthly Expenses">
          <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0" className={INPUT_CLASS} />
        </Field>
        <Field label="Risk Multiplier">
          <select value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} className={INPUT_CLASS}>
            {[3, 4, 5, 6].map((value) => (
              <option key={value} value={value} className="bg-bg-main">
                {value} months
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current Savings">
          <input type="number" value={savings} onChange={(e) => setSavings(e.target.value)} placeholder="0" className={INPUT_CLASS} />
        </Field>
      </div>

      {monthlyVal > 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResultTile title="Target Reserve" value={formatCurrency(target)} tone="primary" helper={`${multiplier} months of expenses`} />
            <ResultTile title="Current Gap" value={formatCurrency(gap)} tone={gap > 0 ? 'danger' : 'success'} helper={gap > 0 ? 'Still uncovered' : 'Target reached'} />
            <ResultTile title="Monthly Save Rate" value={`${formatCurrency(need6)} / ${formatCurrency(need12)}`} tone="success" helper="6 month plan / 12 month plan" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-normal text-text-primary">Reserve progress</p>
              <p className="text-sm font-light text-text-secondary">{pct.toFixed(1)}%</p>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-sm font-light text-text-secondary">
              {gap > 0
                ? `Closing the gap at ${formatCurrency(need12)} per month gives you a 12 month path to target.`
                : 'Your current savings already cover the modeled reserve target.'}
            </p>
          </div>
        </div>
      )}
    </CalculatorShell>
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
    <CalculatorShell
      title="Business Interruption Cost Calculator"
      description="Model how much a forced closure could cost once lost sales and ongoing fixed expenses stack up."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Monthly Revenue">
          <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="0" className={INPUT_CLASS} />
        </Field>
        <Field label="Monthly Fixed Costs">
          <input type="number" value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="0" className={INPUT_CLASS} />
        </Field>
        <Field label="Closure Days">
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="0" className={INPUT_CLASS} />
        </Field>
      </div>

      {daysVal > 0 && (revVal > 0 || fixVal > 0) && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResultTile title="Revenue Lost" value={formatCurrency(revLost)} tone="danger" helper={`${daysVal} days of lost sales`} />
            <ResultTile title="Fixed Costs" value={formatCurrency(fixedDuring)} tone="warning" helper="Expenses that keep running" />
            <ResultTile title="Total Exposure" value={formatCurrency(totalImpact)} tone="primary" helper="Combined interruption cost" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-normal text-text-primary">Impact mix</p>
              <p className="text-sm font-light text-text-secondary">
                {totalImpact > 0 ? `${Math.round((revLost / totalImpact) * 100)}% revenue / ${Math.round((fixedDuring / totalImpact) * 100)}% fixed costs` : 'No exposure yet'}
              </p>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/5">
              <div className="bg-gap transition-all duration-300" style={{ width: `${totalImpact > 0 ? (revLost / totalImpact) * 100 : 0}%` }} />
              <div className="bg-underinsured transition-all duration-300" style={{ width: `${totalImpact > 0 ? (fixedDuring / totalImpact) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-light text-text-secondary">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gap" /> Revenue lost</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-underinsured" /> Fixed costs</span>
            </div>
          </div>
        </div>
      )}
    </CalculatorShell>
  );
}

function InsuranceCostEstimator() {
  const [bizType, setBizType] = useState('restaurant');
  const [annualRev, setAnnualRev] = useState('');
  const [employees, setEmployees] = useState('');
  const [zip, setZip] = useState('');

  const revFactor = Math.max(1, (parseFloat(annualRev) || 100000) / 100000);
  const empFactor = Math.max(1, 1 + ((parseFloat(employees) || 1) - 1) * 0.1);
  const tiers = TIERS[bizType];

  return (
    <CalculatorShell
      title="Insurance Cost Estimator"
      description="Compare lean, recommended, and full-stack coverage ranges using your size and staffing assumptions."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Field label="Business Type">
          <select value={bizType} onChange={(e) => setBizType(e.target.value)} className={INPUT_CLASS}>
            <option value="restaurant" className="bg-bg-main">Restaurant</option>
            <option value="retail" className="bg-bg-main">Retail</option>
            <option value="salon" className="bg-bg-main">Salon</option>
            <option value="contractor" className="bg-bg-main">Contractor</option>
          </select>
        </Field>
        <Field label="Annual Revenue">
          <input type="number" value={annualRev} onChange={(e) => setAnnualRev(e.target.value)} placeholder="100000" className={INPUT_CLASS} />
        </Field>
        <Field label="Employees">
          <input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} placeholder="1" className={INPUT_CLASS} />
        </Field>
        <Field label="Zip Code">
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="77004" className={INPUT_CLASS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Object.entries(tiers).map(([key, tier]) => {
          const low = Math.round(tier.range[0] * revFactor * empFactor);
          const high = Math.round(tier.range[1] * revFactor * empFactor);
          const label = key === 'essential' ? 'Essential' : key === 'recommended' ? 'Recommended' : 'Comprehensive';

          return (
            <div key={key} className={`rounded-2xl border p-5 ${TIER_STYLES[key]}`}>
              <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">{label}</p>
              <div className="mt-3">
                <StatValue value={`${formatCurrency(low)} to ${formatCurrency(high)}`} color={key === 'recommended' ? 'primary' : key === 'comprehensive' ? 'success' : 'neutral'} size="sm" />
              </div>
              <p className="mt-2 text-sm font-light text-text-secondary">Estimated annual premium range</p>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm font-normal text-text-primary">Included coverage</p>
                <ul className="mt-3 space-y-2 text-sm font-light text-text-secondary">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </CalculatorShell>
  );
}

export default function Calculators() {
  const [active, setActive] = useState(TABS[0].id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Financial Calculators</h2>
        <p className="mt-1.5 text-sm font-light text-text-secondary">Use clean planning tools to model reserve needs, downtime cost, and coverage pricing.</p>
      </div>

      <PillTabs active={active} onChange={setActive} />

      {active === 'emergency' && <EmergencyFundCalc />}
      {active === 'interruption' && <BusinessInterruptionCalc />}
      {active === 'insurance' && <InsuranceCostEstimator />}
    </div>
  );
}
