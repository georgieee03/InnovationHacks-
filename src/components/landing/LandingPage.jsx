import { useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  BrainCircuit,
  Layers3,
  Landmark,
  ShieldCheck,
  Sparkles,
  ScrollText,
  Zap,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import ParticleGrid from '../shared/ParticleGrid';
import CursorSpotlight from '../shared/CursorSpotlight';
import {
  brandHighlights,
  featureCards,
  finalCtaContent,
  heroContent,
  landingNavLinks,
  missionContent,
  workflowSteps,
} from './landingData';
import {
  createRevealVariants,
  createStaggerVariants,
  landingEase,
  useLandingSection,
  useTiltMotion,
} from './useLandingMotion';

const MotionSection = motion.section;
const MotionDiv = motion.div;
const MotionArticle = motion.article;
const MotionAnchor = motion.a;

const iconMap = {
  landmark: Landmark,
  shield: ShieldCheck,
  sparkles: Sparkles,
  scroll: ScrollText,
  badge: BadgeCheck,
  briefcase: BriefcaseBusiness,
  brain: BrainCircuit,
  layers: Layers3,
  zap: Zap,
};

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <MotionDiv variants={createRevealVariants(false, 18)} className={`landing-section-heading${align === 'center' ? ' is-centered' : ''}`}>
      <span className="landing-kicker">{eyebrow}</span>
      <h2 className="landing-section-title">{title}</h2>
      {description ? <p className="landing-section-copy">{description}</p> : null}
    </MotionDiv>
  );
}

function GlassCard({ className = '', children, lift = true }) {
  const { ref, handlers, interactive } = useTiltMotion();

  return (
    <MotionArticle
      className={`landing-card-shell ${className}`.trim()}
      whileHover={interactive && lift ? { y: -8 } : undefined}
      transition={{ duration: 0.28, ease: landingEase }}
    >
      <div ref={ref} className="landing-glass" {...handlers}>
        {children}
      </div>
    </MotionArticle>
  );
}

function HeroAnalyticsShowcase({ lineProgress, miniGraphProgress, prefersReducedMotion }) {
  const linePathLength = useTransform(lineProgress, [0, 1], [0.012, 1]);
  const areaOpacity = useTransform(lineProgress, [0, 0.28, 1], [0.035, 0.14, 0.3]);
  const markerScale = useTransform(lineProgress, [0, 0.32, 1], [0.42, 0.68, 1]);
  const barScaleA = useTransform(miniGraphProgress, [0, 1], [0.26, 1]);
  const barScaleB = useTransform(miniGraphProgress, [0, 1], [0.22, 0.86]);
  const barScaleC = useTransform(miniGraphProgress, [0, 1], [0.18, 0.72]);
  const pulseWidthA = useTransform(miniGraphProgress, [0, 1], ['18%', '92%']);
  const pulseWidthB = useTransform(miniGraphProgress, [0, 1], ['12%', '78%']);
  const pulseWidthC = useTransform(miniGraphProgress, [0, 1], ['10%', '64%']);

  return (
    <div className="landing-analytics-showcase">
      <GlassCard className="landing-analytics-panel" lift={false}>
        <div className="landing-analytics-panel__header">
          <span className="landing-kicker">Live platform signals</span>
          <span className="landing-analytics-chip">Scroll-activated</span>
        </div>

        <div className="landing-analytics-panel__summary">
          <div>
            <span className="landing-analytics-label">Business health</span>
            <strong className="landing-analytics-value">87%</strong>
          </div>
          <div>
            <span className="landing-analytics-label">Coverage sync</span>
            <strong className="landing-analytics-value">Live</strong>
          </div>
          <div>
            <span className="landing-analytics-label">Cashflow trend</span>
            <strong className="landing-analytics-value">Stable</strong>
          </div>
        </div>

        <div className="landing-analytics-chart">
          <svg viewBox="0 0 420 240" className="landing-analytics-chart__svg" aria-hidden="true">
            <path d="M26 188H394" className="landing-analytics-grid-line" />
            <path d="M26 132H394" className="landing-analytics-grid-line" />
            <path d="M26 76H394" className="landing-analytics-grid-line" />
            <motion.path
              d="M26 188C68 180 96 164 130 150C165 136 190 144 226 120C262 96 286 98 322 76C350 60 370 56 394 44L394 188L26 188Z"
              className="landing-analytics-area"
              style={{ opacity: areaOpacity }}
            />
            <motion.path
              d="M26 188C68 180 96 164 130 150C165 136 190 144 226 120C262 96 286 98 322 76C350 60 370 56 394 44"
              className="landing-analytics-line"
              style={{ pathLength: linePathLength }}
            />
            {[130, 226, 322, 394].map((cx, index) => (
              <motion.circle
                key={cx}
                cx={cx}
                cy={[150, 120, 76, 44][index]}
                r="5.5"
                className="landing-analytics-marker"
                style={{ scale: markerScale }}
              />
            ))}
          </svg>
        </div>

        <div className="landing-analytics-footer">
          <span>Plaid-linked</span>
          <span>Coverage-aware</span>
          <span>Action-ready</span>
        </div>
      </GlassCard>

      <div className="landing-analytics-mini-grid">
        <GlassCard className="landing-mini-panel" lift={false}>
          <div className="landing-mini-panel__header">
            <span className="landing-kicker">Reserve curve</span>
            <span className="landing-mini-panel__meta">30 days</span>
          </div>
          <div className="landing-mini-bars" aria-hidden="true">
            <motion.span className="landing-mini-bars__bar" style={{ scaleY: barScaleA }} />
            <motion.span className="landing-mini-bars__bar is-mid" style={{ scaleY: barScaleB }} />
            <motion.span className="landing-mini-bars__bar is-low" style={{ scaleY: barScaleC }} />
          </div>
        </GlassCard>

        <GlassCard className="landing-mini-panel" lift={false}>
          <div className="landing-mini-panel__header">
            <span className="landing-kicker">Workflow pulse</span>
            <span className="landing-mini-panel__meta">{prefersReducedMotion ? 'Steady' : 'Smooth'}</span>
          </div>
          <div className="landing-pulse-list" aria-hidden="true">
            <div className="landing-pulse-row">
              <span>Onboarding</span>
              <motion.span className="landing-pulse-row__fill" style={{ width: pulseWidthA }} />
            </div>
            <div className="landing-pulse-row">
              <span>Protection</span>
              <motion.span className="landing-pulse-row__fill is-alt" style={{ width: pulseWidthB }} />
            </div>
            <div className="landing-pulse-row">
              <span>Operations</span>
              <motion.span className="landing-pulse-row__fill is-soft" style={{ width: pulseWidthC }} />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Section({ id, className = '', deferred = true, children }) {
  const { ref, controls, prefersReducedMotion } = useLandingSection();

  return (
    <MotionSection
      id={id}
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={createStaggerVariants(prefersReducedMotion)}
      className={`landing-section ${deferred ? 'landing-section--deferred' : ''} ${className}`.trim()}
    >
      {children}
    </MotionSection>
  );
}

export default function LandingPage({ loginUrl }) {
  const prefersReducedMotion = useReducedMotion();
  const heroVisualRef = useRef(null);
  const workflowRef = useRef(null);
  const { scrollYProgress: heroVisualScrollYProgress } = useScroll({
    target: heroVisualRef,
    offset: ['start end', 'end start'],
  });
  const heroLineBaseProgress = useTransform(heroVisualScrollYProgress, [0.32, 0.58], [0, 1], {
    clamp: true,
  });
  const heroMiniBaseProgress = useTransform(heroVisualScrollYProgress, [0.4, 0.6], [0, 1], {
    clamp: true,
  });
  const heroLineProgress = useSpring(heroLineBaseProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.34,
  });
  const heroMiniGraphProgress = useSpring(heroMiniBaseProgress, {
    stiffness: 138,
    damping: 28,
    mass: 0.3,
  });
  const { scrollYProgress } = useScroll({
    target: workflowRef,
    offset: ['start 78%', 'end 28%'],
  });
  const workflowProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.35,
  });

  const heroVariants = useMemo(() => createRevealVariants(prefersReducedMotion, 36), [prefersReducedMotion]);
  const heroContainer = useMemo(() => createStaggerVariants(prefersReducedMotion, 0.14), [prefersReducedMotion]);

  return (
    <div className="app-background landing-shell min-h-screen">
      <div className="animated-bg" />
      <ParticleGrid />
      <CursorSpotlight />
      <div className="noise-overlay" />
      <div className="landing-grid-overlay" aria-hidden="true" />
      <div className="landing-orb landing-orb--one" aria-hidden="true" />
      <div className="landing-orb landing-orb--two" aria-hidden="true" />
      <div className="landing-orb landing-orb--three" aria-hidden="true" />

      <header className="landing-nav-wrap">
        <div className="landing-nav">
          <a href="#top" className="landing-brand" aria-label="SafeGuard home">
            <span className="landing-brand__mark">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="landing-brand__copy">
              <strong>SafeGuard</strong>
              <span>Small-business intelligence</span>
            </span>
          </a>

          <nav className="landing-nav__links" aria-label="Landing sections">
            {landingNavLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="landing-nav__actions">
            <ThemeToggle />
            <a href={loginUrl} className="landing-button landing-button--nav">
              Sign in
            </a>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <MotionSection
          id="top"
          className="landing-section landing-hero"
          initial="hidden"
          animate="visible"
          variants={heroContainer}
        >
          <MotionDiv className="landing-hero__copy" variants={heroVariants}>
            <span className="landing-kicker">{heroContent.eyebrow}</span>
            <h1 className="landing-hero__title">{heroContent.title}</h1>
            <p className="landing-hero__description">{heroContent.description}</p>

            <div className="landing-hero__actions">
              <MotionAnchor
                href={loginUrl}
                className="landing-button landing-button--primary"
                whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2, ease: landingEase }}
              >
                {heroContent.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </MotionAnchor>

              <motion.button
                type="button"
                className="landing-button landing-button--secondary"
                onClick={() => scrollToSection('features')}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2, ease: landingEase }}
              >
                {heroContent.secondaryCta}
              </motion.button>
            </div>

            <div className="landing-proof-list">
              {heroContent.proofPoints.map((proof) => (
                <div key={proof} className="landing-proof-pill">
                  <span className="landing-proof-pill__dot" />
                  <span>{proof}</span>
                </div>
              ))}
            </div>

            <div className="landing-stats-strip">
              {heroContent.stats.map((stat) => (
                <GlassCard key={stat.label} className="landing-stat-card" lift={false}>
                  <p className="landing-stat-card__value">{stat.value}</p>
                  <p className="landing-stat-card__label">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </MotionDiv>

          <MotionDiv ref={heroVisualRef} className="landing-hero__visual" variants={heroVariants}>
            <HeroAnalyticsShowcase
              lineProgress={heroLineProgress}
              miniGraphProgress={heroMiniGraphProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
          </MotionDiv>
        </MotionSection>

        <Section id="mission" className="landing-mission">
          <SectionHeading eyebrow={missionContent.eyebrow} title={missionContent.title} description={missionContent.body} />
        </Section>

        <Section id="features" className="landing-features">
          <SectionHeading
            eyebrow="Core capabilities"
            title="Explore our working surfaces"
            description="From live financial signals to policy analysis, planning, contracts, compliance, growth, and tax workflows, SafeGuard is designed as one connected operating layer."
          />

          <div className="landing-feature-grid">
            {featureCards.map((feature) => {
              const Icon = iconMap[feature.icon];

              return (
                <MotionDiv key={feature.title} variants={createRevealVariants(prefersReducedMotion, 24)}>
                  <GlassCard className="landing-feature-card">
                    <div className="landing-feature-card__icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="landing-feature-card__title">{feature.title}</h3>
                    <p className="landing-feature-card__copy">{feature.description}</p>
                    <div className="landing-tag-list">
                      {feature.tags.map((tag) => (
                        <span key={tag} className="landing-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </MotionDiv>
              );
            })}
          </div>
        </Section>

        <Section id="workflow" className="landing-workflow">
          <SectionHeading
            eyebrow="Workflow showcase"
            title="One narrative from onboarding to operations"
            description="SafeGuard is strongest when every step feels like part of the same system rather than a collection of separate tools."
          />

          <div ref={workflowRef} className="landing-workflow-shell">
            <div className="landing-workflow-line" aria-hidden="true">
              <motion.div className="landing-workflow-line__fill" style={{ scaleY: workflowProgress }} />
            </div>

            <div className="landing-workflow-steps">
              {workflowSteps.map((step, index) => (
                <MotionDiv key={step.title} variants={createRevealVariants(prefersReducedMotion, 24)} className="landing-workflow-step">
                  <span className="landing-workflow-step__index">0{index + 1}</span>
                  <GlassCard className="landing-workflow-step__card">
                    <h3 className="landing-workflow-step__title">{step.title}</h3>
                    <p className="landing-workflow-step__copy">{step.description}</p>
                  </GlassCard>
                </MotionDiv>
              ))}
            </div>
          </div>
        </Section>

        <Section id="brand" className="landing-brand-section">
          <SectionHeading
            eyebrow="Brand principles"
            title="A brand language built around clarity, calm, and motion"
            description="These principles shape how SafeGuard should read, move, and feel across the full experience."
          />

          <div className="landing-judge-grid">
            {brandHighlights.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <MotionDiv key={item.title} variants={createRevealVariants(prefersReducedMotion, 24)}>
                  <GlassCard className="landing-judge-card">
                    <div className="landing-feature-card__icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="landing-feature-card__title">{item.title}</h3>
                    <p className="landing-feature-card__copy">{item.description}</p>
                  </GlassCard>
                </MotionDiv>
              );
            })}
          </div>
        </Section>

        <Section id="cta" className="landing-final-cta">
          <GlassCard className="landing-final-cta__card" lift={false}>
            <div className="landing-final-cta__content">
              <span className="landing-kicker">{finalCtaContent.eyebrow}</span>
              <h2 className="landing-section-title">{finalCtaContent.title}</h2>
              <p className="landing-section-copy">{finalCtaContent.description}</p>
            </div>

            <div className="landing-final-cta__actions">
              <MotionAnchor
                href={loginUrl}
                className="landing-button landing-button--primary"
                whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2, ease: landingEase }}
              >
                Enter SafeGuard
                <ArrowRight className="h-4 w-4" />
              </MotionAnchor>

              <motion.button
                type="button"
                className="landing-button landing-button--secondary"
                onClick={() => scrollToSection('top')}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2, ease: landingEase }}
              >
                Back to top
              </motion.button>
            </div>
          </GlassCard>
        </Section>
      </main>
    </div>
  );
}
