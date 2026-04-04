import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
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

function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[420px] h-[560px] rounded-2xl border border-white/10 bg-bg-main/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <ChatBot />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}

function Dashboard() {
  const { isOnboarded, activeTab } = useContext(AppContext);
  if (!isOnboarded) return <Onboarding />;

  return (
    <>
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
              <motion.div key={activeTab} variants={tabVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                {activeTab === 'financial' && <FinancialOverview />}
                {activeTab === 'insurance' && (
                  <div className="space-y-12">
                    <InsuranceAnalyzer />
                    <div className="border-t border-white/10 pt-10">
                      <ActionPlan />
                    </div>
                  </div>
                )}
                {activeTab === 'calculators' && (
                  <div className="space-y-12">
                    <Calculators />
                    <div className="border-t border-white/10 pt-10">
                      <RiskSimulator />
                    </div>
                  </div>
                )}
                {activeTab === 'challenges' && <Challenges />}
                {activeTab === 'report' && <HealthReport />}
                {activeTab === 'learn' && <Education />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <FloatingChat />
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
