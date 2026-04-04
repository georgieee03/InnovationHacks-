import { useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { RISK_LEVEL_COLORS } from '../utils/constants';
import businessTypes from '../data/businessTypes.json';

export default function Sidebar() {
  const { isOnboarded, businessInfo, riskFactors } = useContext(AppContext);

  const typeInfo = businessTypes.find((t) => t.id === businessInfo?.type);

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-white flex flex-col fixed left-0 top-0 z-20 border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover border border-white/5 hover:border-white/10 transition-all duration-200"
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
