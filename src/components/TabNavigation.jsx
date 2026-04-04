import { useContext } from 'react';
import { BarChart3, Shield, Calculator, Trophy, FileText, GraduationCap } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const TABS = [
  { id: 'financial', label: 'Financial Overview', icon: BarChart3 },
  { id: 'insurance', label: 'Insurance & Action Plan', icon: Shield },
  { id: 'calculators', label: 'Calculators & Risk', icon: Calculator },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'report', label: 'Health Report', icon: FileText },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useContext(AppContext);

  return (
    <div className="relative flex overflow-x-auto border-b border-white/10 bg-bg-secondary/50 px-6 backdrop-blur-xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setActiveTab(id)}
          className={`group relative z-10 flex items-center gap-2.5 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-normal tracking-[-0.01em] transition-all duration-300
            ${activeTab === id
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-transparent text-text-secondary hover:border-white/20 hover:bg-white/5 hover:text-text-primary'
            }`}>
          <Icon className={`h-4 w-4 transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
