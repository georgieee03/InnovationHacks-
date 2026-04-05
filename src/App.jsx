import { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, AppContext } from './context/AppContext';
import AuthGate from './components/auth/AuthGate';
import Onboarding from './components/Onboarding';
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
import LoadingSpinner from './components/shared/LoadingSpinner';
import ParticleGrid from './components/shared/ParticleGrid';
import ScrollProgress from './components/shared/ScrollProgress';
import CollapsibleSidebar from './components/layout/CollapsibleSidebar';
import TopBar from './components/layout/TopBar';
import ContractsWorkspace from './components/workspace/ContractsWorkspace';
import QuotesWorkspace from './components/workspace/QuotesWorkspace';
import ReceiptsWorkspace from './components/workspace/ReceiptsWorkspace';
import ComplianceWorkspace from './components/workspace/ComplianceWorkspace';
import GrowthWorkspace from './components/workspace/GrowthWorkspace';

const pageRegistry = {
  financial: { label: 'Financial Overview', component: FinancialOverview },
  insurance: { label: 'Insurance Analyzer', component: InsuranceAnalyzer },
  actionplan: { label: 'Action Plan', component: ActionPlan },
  contracts: { label: 'Contracts', component: ContractsWorkspace },
  quotes: { label: 'Quotes', component: QuotesWorkspace },
  receipts: { label: 'Receipts', component: ReceiptsWorkspace },
  compliance: { label: 'Compliance', component: ComplianceWorkspace },
  growth: { label: 'Growth', component: GrowthWorkspace },
  calculators: { label: 'Calculators', component: Calculators },
  simulator: { label: 'Risk Simulator', component: RiskSimulator },
  challenges: { label: 'Challenges', component: Challenges },
  report: { label: 'Health Report', component: HealthReport },
  chat: { label: 'Chat Assistant', component: ChatBot },
  learn: { label: 'Learning Center', component: Education },
};

const viewTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};
const MotionMain = motion.main;
const MotionDiv = motion.div;

function Dashboard() {
  const {
    authReady,
    authEnabled,
    isAuthenticated,
    authUser,
    loginUrl,
    logoutUrl,
    isOnboarded,
    activeTab,
    businessInfo,
    financialMetrics,
    gapAnalysis,
    viewportMode,
    sidebarExpanded,
    mobileSidebarOpen,
    toggleSidebar,
    openMobileSidebar,
    setSidebarHoverExpanded,
    closeMobileSidebar,
    navigateToTab,
  } = useContext(AppContext);

  if (!authReady) {
    return (
      <div className="app-background min-h-screen">
        <div className="animated-bg" />
        <div className="noise-overlay" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="glass-card w-full max-w-xl rounded-[28px] p-8">
            <LoadingSpinner message="Restoring your SafeGuard workspace..." />
          </div>
        </div>
      </div>
    );
  }

  if (authEnabled && !isAuthenticated) {
    return <AuthGate loginUrl={loginUrl} />;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  const activePage = pageRegistry[activeTab] || pageRegistry.financial;
  const ActiveComponent = activePage.component;
  const sidebarOffset = viewportMode === 'mobile' ? 0 : sidebarExpanded ? 280 : 64;

  return (
    <div className="app-background">
      <div className="animated-bg" />
      <ParticleGrid />
      <div className="noise-overlay" />
      <CursorSpotlight />
      <ScrollProgress />

      <CollapsibleSidebar
        viewportMode={viewportMode}
        isExpanded={sidebarExpanded}
        isMobileOpen={mobileSidebarOpen}
        activeTab={activeTab}
        businessInfo={businessInfo}
        financialMetrics={financialMetrics}
        gapAnalysis={gapAnalysis}
        onNavigate={navigateToTab}
        onHoverExpandedChange={setSidebarHoverExpanded}
        onMobileOpen={openMobileSidebar}
        onMobileClose={closeMobileSidebar}
      />

      <TopBar
        activeLabel={activePage.label}
        businessInfo={businessInfo}
        authUser={authUser}
        logoutUrl={logoutUrl}
        sidebarOffset={sidebarOffset}
        viewportMode={viewportMode}
        isSidebarExpanded={sidebarExpanded}
        isMobileOpen={mobileSidebarOpen}
        onMenuToggle={toggleSidebar}
      />

      <MotionMain
        animate={{
          marginLeft: sidebarOffset,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="enterprise-main relative z-10 min-h-screen max-w-full overflow-x-hidden pt-[104px]"
      >
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <MotionDiv
              key={activeTab}
              variants={viewTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <ActiveComponent />
            </MotionDiv>
          </AnimatePresence>
        </div>
      </MotionMain>
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
