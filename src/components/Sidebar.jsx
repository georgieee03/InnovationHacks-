import { useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { RISK_LEVEL_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatCurrency';
import businessTypes from '../data/businessTypes.json';

export default function Sidebar() {
  const { isOnboarded, businessInfo, riskFactors } = useContext(AppContext);

  const typeInfo = businessTypes.find((t) => t.id === businessInfo?.type);

  return (
    <aside className="fixed left-0 top-0 z-10 flex min-h-screen w-64 flex-col bg-sidebar text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-6">
        <Shield className="h-7 w-7 text-primary" />
        <span className="text-xl font-heading font-bold">SafeGuard</span>
      </div>

      {isOnboarded && businessInfo && (
        <>
          <div className="border-b border-white/10 px-5 py-5">
            <p className="mb-2 text-sm uppercase tracking-wider text-gray-400">Business</p>
            <p className="text-lg font-semibold">{businessInfo.name}</p>
            {typeInfo && (
              <p className="mt-1 text-sm text-gray-300">{typeInfo.icon} {typeInfo.label}</p>
            )}
            <p className="mt-1 text-sm text-gray-400">
              {businessInfo.city}, {businessInfo.state} {businessInfo.zip}
            </p>
            {businessInfo.monthlyRevenue > 0 && (
              <p className="mt-3 text-sm text-gray-300">
                Revenue estimate: <span className="font-medium text-white">{formatCurrency(businessInfo.monthlyRevenue)}/mo</span>
              </p>
            )}
          </div>

          {riskFactors && (
            <div className="px-5 py-5">
              <p className="mb-3 text-sm uppercase tracking-wider text-gray-400">Location Risks</p>
              <div className="flex flex-col gap-2">
                {Object.entries(riskFactors.risks).map(([key, risk]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg bg-sidebar-hover px-3 py-2"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: RISK_LEVEL_COLORS[risk.level] }}
                    />
                    <span className="text-sm text-gray-200">{risk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
