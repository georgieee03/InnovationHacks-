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
    <div className="flex border-b border-white/10 bg-bg-secondary/50 backdrop-blur-xl px-6 overflow-x-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all duration-300 whitespace-nowrap relative z-10 group
            ${activeTab === id
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/20 hover:bg-white/5'
            }`}
        >
          <Icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span className="tracking-wide">{label}</span>
        </button>
      ))}
    </div>
  );
}
