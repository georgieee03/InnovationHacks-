import { useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { RISK_LEVEL_COLORS } from '../utils/constants';
import businessTypes from '../data/businessTypes.json';

export default function Sidebar() {
  const { isOnboarded, businessInfo, riskFactors } = useContext(AppContext);
  const typeInfo = businessTypes.find((t) => t.id === businessInfo?.type);

  return (
    <aside className="fixed left-0 top-0 z-20 flex min-h-screen w-64 flex-col border-r border-white/10 bg-sidebar text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <span className="text-xl font-heading font-normal tracking-[-0.02em]">SafeGuard</span>
      </div>
      {isOnboarded && businessInfo && (
        <>
          <div className="border-b border-white/10 px-5 py-5">
            <p className="mb-2 text-sm font-normal uppercase tracking-[0.05em] text-gray-400">Business</p>
            <p className="text-lg font-normal tracking-[-0.02em]">{businessInfo.name}</p>
            {typeInfo && <p className="mt-1 text-sm font-light text-gray-300">{typeInfo.icon} {typeInfo.label}</p>}
            <p className="mt-1 text-sm font-light text-gray-400">{businessInfo.city}, {businessInfo.state} {businessInfo.zip}</p>
          </div>
          {riskFactors && (
            <div className="px-5 py-5">
              <p className="mb-3 text-sm font-normal uppercase tracking-[0.05em] text-gray-400">Location Risks</p>
              <div className="flex flex-col gap-2">
                {Object.entries(riskFactors.risks).map(([key, risk]) => (
                  <div key={key} className="flex items-center gap-2 rounded-lg border border-white/5 bg-sidebar-hover px-3 py-2 transition-all duration-200 hover:border-white/10">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: RISK_LEVEL_COLORS[risk.level] }} />
                    <span className="text-sm font-light text-gray-200">{risk.label}</span>
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