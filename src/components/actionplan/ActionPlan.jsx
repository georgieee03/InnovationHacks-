import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import RecommendationCard from './RecommendationCard';
import RiskTimeline from './RiskTimeline';
import SavingsProjection from './SavingsProjection';

export default function ActionPlan() {
  const { gapAnalysis, financialMetrics } = useContext(AppContext);

  const actionItems = gapAnalysis?.filter(g => g.status === 'gap' || g.status === 'underinsured') || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Action Plan</h2>
        <p className="text-text-secondary mt-1">
          {actionItems.length > 0
            ? `${actionItems.length} items need your attention`
            : 'Upload your insurance policy in the Insurance Analyzer tab to generate your action plan'
          }
        </p>
      </div>

      {actionItems.length > 0 ? (
        <>
          <RiskTimeline gaps={gapAnalysis} />

          <div>
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Recommendations</h3>
            <div className="space-y-3">
              {actionItems.map(item => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <SavingsProjection metrics={financialMetrics} />
        </>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-text-secondary">
            Complete the Insurance Analyzer first to see your personalized action plan.
          </p>
        </div>
      )}
    </div>
  );
}
