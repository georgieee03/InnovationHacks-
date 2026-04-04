import { useContext } from 'react';
import { BarChart3, Shield, ClipboardCheck } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const TABS = [
  { id: 'financial', label: 'Financial Overview', icon: BarChart3 },
  { id: 'insurance', label: 'Insurance Analyzer', icon: Shield },
  { id: 'actionplan', label: 'Action Plan', icon: ClipboardCheck },
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useContext(AppContext);

  return (
    <div className="flex border-b border-gray-200 bg-white px-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
              }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
