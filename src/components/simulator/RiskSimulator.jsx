import { useContext, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, DollarSign, ShieldCheck, ShieldOff, Waves, Flame, Scale, Wrench, Database, HardHat } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import StatValue from '../shared/StatValue';

const SCENARIOS = [
  {
    id: 'flood',
    label: 'Flash Flood',
    category: 'Weather',
    description: 'Water damage forces cleanup, destroys stock, and interrupts sales.',
    impact: 45000,
    recovery: 30,
    coverageId: 'flood',
    Icon: Waves,
  },
  {
    id: 'fire',
    label: 'Kitchen Fire',
    category: 'Property',
    description: 'Fire and smoke damage knock out equipment and close the location.',
    impact: 75000,
    recovery: 60,
    coverageId: 'commercial_property',
    Icon: Flame,
  },
  {
    id: 'lawsuit',
    label: 'Slip and Fall Lawsuit',
    category: 'Liability',
    description: 'A customer injury claim creates legal defense and settlement exposure.',
    impact: 35000,
    recovery: 90,
    coverageId: 'general_liability',
    Icon: Scale,
  },
  {
    id: 'equipment',
    label: 'Equipment Failure',
    category: 'Operations',
    description: 'Critical equipment goes down and service capacity collapses.',
    impact: 8000,
    recovery: 14,
    coverageId: 'equipment_breakdown',
    Icon: Wrench,
  },
  {
    id: 'databreach',
    label: 'Data Breach',
    category: 'Cyber',
    description: 'Payment or customer data exposure creates response and downtime cost.',
    impact: 50000,
    recovery: 45,
    coverageId: 'cyber_liability',
    Icon: Database,
  },
  {
    id: 'injury',
    label: 'Employee Injury',
    category: 'Workplace',
    description: 'Medical cost, lost productivity, and payroll pressure hit at once.',
    impact: 25000,
    recovery: 30,
    coverageId: 'workers_comp',
    Icon: HardHat,
  },
];

const STATUS_STYLES = {
  covered: {
    label: 'Mostly covered',
    tone: 'success',
    cardClass: 'border-covered/20 bg-covered/10',
    textClass: 'text-covered',
    ratio: 0.85,
  },
  underinsured: {
    label: 'Partially covered',
    tone: 'warning',
    cardClass: 'border-underinsured/20 bg-underinsured/10',
    textClass: 'text-underinsured',
    ratio: 0.45,
  },
  gap: {
    label: 'Not covered',
    tone: 'danger',
    cardClass: 'border-gap/20 bg-gap/10',
    textClass: 'text-gap',
    ratio: 0,
  },
  'not-applicable': {
    label: 'Low relevance here',
    tone: 'neutral',
    cardClass: 'border-white/10 bg-white/5',
    textClass: 'text-text-secondary',
    ratio: 0,
  },
};

const SELECTED_SCENARIO_STYLE = {
  '--surface-panel-border-color': 'rgba(6, 182, 212, 0.35)',
  '--surface-panel-strong-background': 'linear-gradient(180deg, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0.08) 38%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.05)',
  '--surface-panel-strong-shadow-color': '0 18px 34px rgba(6, 182, 212, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(255, 255, 255, 0.03)',
};

const COVERAGE_SURFACE_STYLES = {
  covered: {
    '--surface-panel-border-color': 'rgba(16, 185, 129, 0.26)',
    '--surface-panel-background': 'linear-gradient(180deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.07) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.04)',
    '--surface-panel-strong-background': 'linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.05)',
  },
  underinsured: {
    '--surface-panel-border-color': 'rgba(245, 158, 11, 0.26)',
    '--surface-panel-background': 'linear-gradient(180deg, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0.07) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.04)',
    '--surface-panel-strong-background': 'linear-gradient(180deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.08) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.05)',
  },
  gap: {
    '--surface-panel-border-color': 'rgba(239, 68, 68, 0.24)',
    '--surface-panel-background': 'linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.06) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.04)',
    '--surface-panel-strong-background': 'linear-gradient(180deg, rgba(239, 68, 68, 0.17) 0%, rgba(239, 68, 68, 0.08) 42%, rgba(255, 255, 255, 0.04) 100%), rgba(255, 255, 255, 0.05)',
  },
  'not-applicable': {
    '--surface-panel-border-color': 'var(--color-border-default)',
  },
};

function findCoverageMatch(gapAnalysis, coverageId) {
  const items = Array.isArray(gapAnalysis) ? gapAnalysis : [];

  return items.find((item) => {
    const id = item.id?.toLowerCase() || '';
    const name = item.name?.toLowerCase() || '';
    const target = coverageId.toLowerCase();
    return id === target || id.includes(target) || target.includes(id) || name.includes(target.replace(/_/g, ' '));
  });
}

function getScenarioCoverage(gapAnalysis, coverageId) {
  const match = findCoverageMatch(gapAnalysis, coverageId);
  const status = match?.status || 'gap';
  const style = STATUS_STYLES[status] || STATUS_STYLES.gap;

  return {
    match,
    status,
    style,
    ratio: style.ratio,
  };
}

function SummaryTile({ title, value, tone, helper }) {
  return (
    <div className="surface-panel rounded-2xl p-4">
      <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">{title}</p>
      <div className="mt-3">
        <StatValue value={value} color={tone} size="md" />
      </div>
      {helper && <p className="mt-2 text-xs font-light text-text-secondary">{helper}</p>}
    </div>
  );
}

export default function RiskSimulator() {
  const { gapAnalysis, financialMetrics } = useContext(AppContext);
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);

  const scenario = useMemo(
    () => SCENARIOS.find((item) => item.id === selectedId) || SCENARIOS[0],
    [selectedId]
  );

  const coverage = getScenarioCoverage(gapAnalysis, scenario.coverageId);
  const coveredAmount = Math.round(scenario.impact * coverage.ratio);
  const outOfPocket = scenario.impact - coveredAmount;
  const coveredPct = scenario.impact > 0 ? (coveredAmount / scenario.impact) * 100 : 0;
  const reserves = financialMetrics?.currentReserves || 0;
  const shortfall = Math.max(0, outOfPocket - reserves);
  const bufferAfterEvent = Math.max(0, reserves - outOfPocket);
  const hasGapAnalysis = Array.isArray(gapAnalysis) && gapAnalysis.length > 0;
  const coverageSurfaceStyle = COVERAGE_SURFACE_STYLES[coverage.status] || COVERAGE_SURFACE_STYLES.gap;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-heading font-thin tracking-[-0.03em] text-text-primary">Risk Simulator</h2>
        <p className="mt-1.5 text-sm font-light text-text-secondary">
          Stress-test a real disruption and compare the hit against your current coverage and cash reserves.
        </p>
      </div>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">Scenario selection</p>
            <p className="mt-1 text-sm font-light text-text-secondary">Choose a single event to see the likely uninsured exposure.</p>
          </div>
          {!hasGapAnalysis && (
            <span className="inline-flex items-center gap-2 rounded-full border border-underinsured/20 bg-underinsured/10 px-3 py-1 text-xs font-normal text-underinsured">
              <AlertTriangle className="h-3.5 w-3.5" />
              Using worst-case assumptions until policy analysis is loaded
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SCENARIOS.map((item) => {
            const Icon = item.Icon;
            const selected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                style={selected ? SELECTED_SCENARIO_STYLE : undefined}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? 'surface-panel-strong focus-ring-brand border-primary/35 shadow-[0_0_0_1px_rgba(6,182,212,0.12)]'
                    : 'surface-panel focus-ring-brand hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">{item.category}</p>
                    <p className="mt-2 text-lg font-normal tracking-[-0.02em] text-text-primary">{item.label}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selected ? 'bg-primary/15 text-primary shadow-[0_12px_24px_rgba(6,182,212,0.14)]' : 'surface-chip text-text-secondary'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-light leading-6 text-text-secondary">{item.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">Selected event</p>
              <h3 className="mt-2 text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">{scenario.label}</h3>
              <p className="mt-2 max-w-2xl text-sm font-light leading-7 text-text-secondary">{scenario.description}</p>
            </div>
            <div style={coverageSurfaceStyle} className="surface-panel rounded-2xl border px-4 py-3">
              <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">Coverage status</p>
              <p className={`mt-2 text-sm font-normal ${coverage.style.textClass}`}>{coverage.style.label}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryTile title="Total impact" value={formatCurrency(scenario.impact)} tone="danger" helper={`${scenario.recovery} day recovery estimate`} />
            <SummaryTile title="Insurance response" value={formatCurrency(coveredAmount)} tone={coverage.style.tone} helper={coverage.match ? coverage.match.name : 'No matching coverage found'} />
            <SummaryTile title="Uninsured hit" value={formatCurrency(outOfPocket)} tone={outOfPocket > 0 ? 'danger' : 'success'} helper={outOfPocket > 0 ? 'Direct cash exposure' : 'Fully absorbed'} />
          </div>

          <div className="surface-panel mt-6 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-normal text-text-primary">Coverage breakdown</p>
              <p className="text-sm font-light text-text-secondary">{coveredPct.toFixed(0)}% covered</p>
            </div>
            <div className="surface-progress-track mt-3 h-3 w-full overflow-hidden rounded-full">
              <div className="h-full bg-covered transition-all duration-300" style={{ width: `${coveredPct}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-light text-text-secondary">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-covered" /> Covered by insurance</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gap" /> Cash you absorb</span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section style={coverageSurfaceStyle} className="surface-panel-strong rounded-2xl p-5">
            <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">Policy read</p>
            <div className="mt-3 flex items-center gap-3">
              {outOfPocket > 0 ? <ShieldOff className={`h-5 w-5 ${coverage.style.textClass}`} /> : <ShieldCheck className={`h-5 w-5 ${coverage.style.textClass}`} />}
              <p className={`text-lg font-normal tracking-[-0.02em] ${coverage.style.textClass}`}>{coverage.style.label}</p>
            </div>
            <p className="mt-3 text-sm font-light leading-7 text-text-secondary">
              {coverage.match
                ? `${coverage.match.name} is currently marked as ${coverage.match.statusLabel}.`
                : 'This event does not appear to have a matching protection line in the current analysis.'}
            </p>
            {coverage.match?.whyItMatters && (
              <p className="mt-3 text-sm font-light leading-7 text-text-secondary">{coverage.match.whyItMatters}</p>
            )}
          </section>

          <section className="glass-card p-5">
            <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">Reserve readiness</p>
            <div className="mt-3 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <p className="text-lg font-normal tracking-[-0.02em] text-text-primary">Current reserves: {formatCurrency(reserves)}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="surface-panel rounded-2xl p-4">
                <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">Shortfall</p>
                <div className="mt-3">
                  <StatValue value={formatCurrency(shortfall)} color={shortfall > 0 ? 'danger' : 'success'} size="sm" />
                </div>
              </div>
              <div className="surface-panel rounded-2xl p-4">
                <p className="text-[11px] font-normal uppercase tracking-[0.05em] text-text-secondary">Buffer after event</p>
                <div className="mt-3">
                  <StatValue value={formatCurrency(bufferAfterEvent)} color={bufferAfterEvent > 0 ? 'success' : 'neutral'} size="sm" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm font-light leading-7 text-text-secondary">
              {shortfall > 0
                ? `A ${scenario.label.toLowerCase()} would leave you short by ${formatCurrency(shortfall)} after insurance and reserves.`
                : 'Current reserves can absorb the uninsured portion of this event.'}
            </p>
          </section>

          <section className="glass-card p-5">
            <p className="text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">Response note</p>
            <div className="mt-3 flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-text-secondary" />
              <p className="text-lg font-normal tracking-[-0.02em] text-text-primary">{scenario.recovery} day recovery window</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm font-light leading-7 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Expect cash strain from downtime, cleanup, and replacement cost at the same time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>The modeled insurance response is tied to {coverage.match ? coverage.match.name : 'the closest matching protection line'}.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>If this scenario matters most to you, use the action plan to close the related coverage gap first.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
