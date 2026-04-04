export default function RiskTimeline({ gaps }) {
  if (!gaps?.length) return null;

  const priorityOrder = { critical: 0, recommended: 1, conditional: 2 };
  const sorted = [...gaps]
    .filter(g => g.status === 'gap' || g.status === 'underinsured')
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  if (!sorted.length) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Priority Action Items</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {sorted.map((item, i) => (
            <div key={item.id} className="flex items-start gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${
                item.priority === 'critical' ? 'bg-gap' :
                item.priority === 'recommended' ? 'bg-underinsured' : 'bg-primary'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 pb-2">
                <p className="font-medium text-text-primary">{item.name}</p>
                <p className="text-sm text-text-secondary">{item.statusLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
