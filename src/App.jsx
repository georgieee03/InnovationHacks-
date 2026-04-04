import { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import TabNavigation from './components/TabNavigation';
import FinancialOverview from './components/financial/FinancialOverview';
import InsuranceAnalyzer from './components/insurance/InsuranceAnalyzer';
import ActionPlan from './components/actionplan/ActionPlan';

const tabVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'financial' && <FinancialOverview />}
              {activeTab === 'insurance' && <InsuranceAnalyzer />}
              {activeTab === 'actionplan' && <ActionPlan />}
            </motion.div>
          </AnimatePresence>
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
