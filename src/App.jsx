import { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import TabNavigation from './components/TabNavigation';
import FinancialOverview from './components/financial/FinancialOverview';
import InsuranceAnalyzer from './components/insurance/InsuranceAnalyzer';
import ActionPlan from './components/actionplan/ActionPlan';
import Calculators from './components/calculators/Calculators';
import RiskSimulator from './components/simulator/RiskSimulator';
import Challenges from './components/gamification/Challenges';
import HealthReport from './components/report/HealthReport';
import ChatBot from './components/chat/ChatBot';
import Education from './components/education/Education';
import CursorSpotlight from './components/shared/CursorSpotlight';
import ParticleGrid from './components/shared/ParticleGrid';

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
    <>
      {/* Animated Background Layers */}
      <div className="animated-bg" />
      <ParticleGrid />
      <div className="noise-overlay" />
      <CursorSpotlight />
      
      <div className="flex min-h-screen relative z-10 max-w-full overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 max-w-[calc(100vw-16rem)]">
          <TabNavigation />
          <div className="p-6 max-w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {activeTab === 'financial' && <FinancialOverview />}
                {activeTab === 'insurance' && <InsuranceAnalyzer />}
                {activeTab === 'actionplan' && <ActionPlan />}
                {activeTab === 'calculators' && <Calculators />}
                {activeTab === 'simulator' && <RiskSimulator />}
                {activeTab === 'challenges' && <Challenges />}
                {activeTab === 'report' && <HealthReport />}
                {activeTab === 'chat' && <ChatBot />}
                {activeTab === 'learn' && <Education />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
