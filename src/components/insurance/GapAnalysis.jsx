import PolicyCard from './PolicyCard';

export default function GapAnalysis({ gaps }) {
  if (!gaps?.length) return null;

  const critical = gaps.filter(g => g.status === 'gap' && g.priority === 'critical');
  const underinsured = gaps.filter(g => g.status === 'underinsured');
  const covered = gaps.filter(g => g.status === 'covered');
  const other = gaps.filter(g => g.status === 'gap' && g.priority !== 'critical');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gap" /> {critical.length + other.length} Gaps
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-underinsured" /> {underinsured.length} Underinsured
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-covered" /> {covered.length} Covered
        </span>
      </div>

      {critical.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-gap mb-3">Critical Gaps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critical.map(p => <PolicyCard key={p.id} policy={p} />)}
          </div>
        </div>
      )}

      {underinsured.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-underinsured mb-3">Underinsured</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {underinsured.map(p => <PolicyCard key={p.id} policy={p} />)}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Recommended</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {other.map(p => <PolicyCard key={p.id} policy={p} />)}
          </div>
        </div>
      )}

      {covered.length > 0 && (
        <div>
          <h3 className="text-lg font-heading font-semibold text-covered mb-3">Adequately Covered</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {covered.map(p => <PolicyCard key={p.id} policy={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
