import { useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { RISK_LEVEL_COLORS } from '../utils/constants';
import businessTypes from '../data/businessTypes.json';

export default function Sidebar() {
  const { isOnboarded, businessInfo, riskFactors } = useContext(AppContext);

  const typeInfo = businessTypes.find((t) => t.id === businessInfo?.type);

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-white flex flex-col fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6 border-b border-white/10">
        <Shield className="w-7 h-7 text-primary" />
        <span className="text-xl font-heading font-bold">SafeGuard</span>
      </div>

      {isOnboarded && businessInfo && (
        <>
          {/* Business Info */}
          <div className="px-5 py-5 border-b border-white/10">
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Business</p>
            <p className="font-semibold text-lg">{businessInfo.name}</p>
            {typeInfo && (
              <p className="text-sm text-gray-300 mt-1">{typeInfo.icon} {typeInfo.label}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {businessInfo.city}, {businessInfo.state} {businessInfo.zip}
            </p>
          </div>

          {/* Risk Factors */}
          {riskFactors && (
            <div className="px-5 py-5">
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-3">Location Risks</p>
              <div className="flex flex-col gap-2">
                {Object.entries(riskFactors.risks).map(([key, risk]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
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
