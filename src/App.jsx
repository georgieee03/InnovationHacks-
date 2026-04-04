import { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import TabNavigation from './components/TabNavigation';
import FinancialOverview from './components/financial/FinancialOverview';
import InsuranceAnalyzer from './components/insurance/InsuranceAnalyzer';
import ActionPlan from './components/actionplan/ActionPlan';

function Dashboard() {
  const { isOnboarded, activeTab } = useContext(AppContext);

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="flex min-h-screen bg-bg-main">
      <Sidebar />
      <main className="flex-1 ml-64">
        <TabNavigation />
        <div className="p-6">
          {activeTab === 'financial' && <FinancialOverview />}
          {activeTab === 'insurance' && <InsuranceAnalyzer />}
          {activeTab === 'actionplan' && <ActionPlan />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
