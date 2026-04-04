import { useContext } from 'react';
import { BarChart3, Shield, ClipboardCheck, Calculator, AlertTriangle, Trophy, FileText, MessageCircle, GraduationCap } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const TABS = [
  { id: 'financial', label: 'Financial Overview', icon: BarChart3 },
  { id: 'insurance', label: 'Insurance Analyzer', icon: Shield },
  { id: 'actionplan', label: 'Action Plan', icon: ClipboardCheck },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
  { id: 'simulator', label: 'Risk Simulator', icon: AlertTriangle },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'report', label: 'Health Report', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useContext(AppContext);

  return (
    <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-6">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition
            ${activeTab === id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
            }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
