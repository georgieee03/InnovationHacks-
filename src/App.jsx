import { Component, useContext } from 'react';
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

const tabVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error) {
    console.error('App render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-main p-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gap/20 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-heading font-bold text-text-primary">SafeGuard hit a rendering error</h1>
            <p className="mt-2 text-text-secondary">Refresh the page and try again. If this keeps happening, share the message below.</p>
            <pre className="mt-4 overflow-auto rounded-lg bg-bg-main p-4 text-sm text-gap">{this.state.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Dashboard() {
  const { isOnboarded, activeTab, financialMetrics } = useContext(AppContext);

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="flex min-h-screen bg-bg-main">
      <Sidebar />
      <main className="ml-64 flex-1">
        <TabNavigation />
        <div className="p-6">
          {!financialMetrics ? (
            <div className="rounded-xl border border-gray-100 bg-card p-6 shadow-sm">
              <p className="text-text-secondary">Preparing your dashboard...</p>
            </div>
          ) : null}

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
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </AppErrorBoundary>
  );
}
