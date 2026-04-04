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
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition
            ${activeTab === id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
            }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
