import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Database,
  Hammer,
  Loader2,
  MapPin,
  Scissors,
  Shield,
  Store,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { api } from '../services/apiClient';
import { clearPendingPlaidSession, getStoredPlaidFormData } from '../services/plaidSession';
import businessTypes from '../data/businessTypes.json';
import riskFactorsData from '../data/riskFactors.json';
import PlaidConnect from './financial/PlaidConnect';
import RippleButton from './shared/RippleButton';

const DEFAULT_FORM = {
  name: '',
  type: 'restaurant',
  zip: '',
  city: '',
  state: '',
  monthlyRevenue: '',
  employees: '',
};

const LOOKUP_IDLE_MESSAGE = 'Enter a 5-digit ZIP code and SafeGuard will auto-populate city and state.';

const STEP_META = [
  { id: 'identity', title: 'Business', eyebrow: 'Step 1', summary: 'Name and industry' },
  { id: 'location', title: 'Location', eyebrow: 'Step 2', summary: 'ZIP-driven risk lookup' },
  { id: 'financials', title: 'Financials', eyebrow: 'Step 3', summary: 'Revenue and headcount' },
  { id: 'connect', title: 'Finish', eyebrow: 'Step 4', summary: 'Choose your entry path' },
];

const BUSINESS_TYPE_ICONS = {
  restaurant: UtensilsCrossed,
  retail: Store,
  salon: Scissors,
  contractor: Hammer,
};

function getBusinessTypeDisplayLabel(businessType) {
  return businessType?.label || 'Business type';
}

function getBusinessTypeIcon(businessTypeId) {
  return BUSINESS_TYPE_ICONS[businessTypeId] || BriefcaseBusiness;
}

function normalizeZip(value) {
  return value.replace(/\D/g, '').slice(0, 5);
}

function normalizeState(value) {
  return value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function getInitialStep(form) {
  if (!form.name?.trim() || !form.type) {
    return 0;
  }

  if (!/^\d{5}$/.test(form.zip?.trim() || '') || !form.city?.trim() || !form.state?.trim()) {
    return 1;
  }

  if (!isPositiveNumber(Number(form.monthlyRevenue)) || !isPositiveNumber(Number(form.employees))) {
    return 2;
  }

  return 3;
}

function StepPill({ step, index, active, complete, enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={`surface-chip min-w-[132px] rounded-2xl px-3 py-3 text-left transition-all duration-200 ${
        active
          ? 'border-primary/35 bg-primary/10 shadow-[0_12px_28px_rgba(0,207,49,0.12)]'
          : complete
            ? 'border-covered/25 bg-covered/10'
            : 'opacity-80'
      } ${!enabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.06em] text-text-secondary">{step.eyebrow}</p>
          <p className={`mt-1 text-sm ${active ? 'font-medium text-text-primary' : 'font-normal text-text-secondary'}`}>
            {step.title}
          </p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
            complete
              ? 'border-covered/30 bg-covered/10 text-covered'
              : active
                ? 'border-primary/35 bg-primary/10 text-primary'
                : 'border-white/10 bg-white/[0.04] text-text-secondary'
          }`}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>
      </div>
      <p className="mt-2 text-xs text-text-secondary">{step.summary}</p>
    </button>
  );
}

function QuestionShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  accent = 'primary',
}) {
  const accentClasses = accent === 'covered'
    ? 'border-covered/25 bg-covered/10'
    : accent === 'warning'
      ? 'border-underinsured/25 bg-underinsured/10'
      : 'border-primary/25 bg-primary/10';

  return (
    <motion.section
      layout
      className="surface-panel-strong rounded-[28px] p-5 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-4">
        <div className={`surface-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentClasses}`}>
          <Icon className={`h-5 w-5 ${accent === 'covered' ? 'text-covered' : accent === 'warning' ? 'text-underinsured' : 'text-primary'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-text-secondary">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-heading font-light tracking-[-0.03em] text-text-primary">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">{description}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function SignalInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: Icon,
  inputMode,
  maxLength,
  readOnly = false,
  disabled = false,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="surface-panel rounded-[30px] p-5">
      <label className="text-[11px] font-normal uppercase tracking-[0.08em] text-text-secondary">{label}</label>
      <div
        className={`mt-4 flex min-h-[80px] items-center gap-4 rounded-[24px] border px-5 py-4 transition-all duration-200 ${
          isFocused
            ? 'border-primary/35 bg-primary/[0.08] shadow-[0_14px_28px_rgba(0,207,49,0.1)]'
            : 'border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        {Icon ? (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${
              isFocused
                ? 'border-primary/25 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.04] text-text-secondary'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`control-input w-full rounded-2xl border-0 bg-transparent px-0 py-2 text-lg font-normal tracking-[-0.02em] text-text-primary shadow-none outline-none placeholder:text-text-muted appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            readOnly ? 'cursor-default' : ''
          }`}
        />
      </div>
    </div>
  );
}

function BusinessTypeCard({ businessType, selected, onSelect }) {
  const Icon = getBusinessTypeIcon(businessType.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-3xl border p-4 text-left transition-all duration-200 ${
        selected
          ? 'surface-panel-strong border-primary/35 bg-primary/10 shadow-[0_16px_34px_rgba(0,207,49,0.12)]'
          : 'surface-panel hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-primary/15 text-primary' : 'surface-chip text-text-secondary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm tracking-[-0.01em] ${selected ? 'font-medium text-text-primary' : 'font-normal text-text-secondary'}`}>
            {getBusinessTypeDisplayLabel(businessType)}
          </p>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="surface-panel rounded-2xl px-4 py-3">
      <p className="text-[11px] font-normal uppercase tracking-[0.07em] text-text-secondary">{label}</p>
      <p className="mt-2 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export default function Onboarding() {
  const { onboard, loadDemo, loading } = useContext(AppContext);
  const restoredForm = getStoredPlaidFormData() || {};
  const [businessTypeOptions, setBusinessTypeOptions] = useState(businessTypes);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    ...restoredForm,
  }));
  const [activeStep, setActiveStep] = useState(() => getInitialStep({ ...DEFAULT_FORM, ...restoredForm }));
  const [zipLookup, setZipLookup] = useState(() => (
    restoredForm.zip && restoredForm.city && restoredForm.state
      ? { status: 'resolved', message: `${restoredForm.city}, ${restoredForm.state} ready.` }
      : { status: 'idle', message: LOOKUP_IDLE_MESSAGE }
  ));

  useEffect(() => {
    let active = true;

    api.getBusinessTypes()
      .then((types) => {
        if (active && Array.isArray(types) && types.length) {
          setBusinessTypeOptions(types);
        }
      })
      .catch(() => {
        if (active) {
          setBusinessTypeOptions(businessTypes);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const zip = form.zip.trim();

    if (zip.length < 5) {
      setZipLookup({ status: 'idle', message: LOOKUP_IDLE_MESSAGE });
      return undefined;
    }

    let active = true;
    setZipLookup({ status: 'loading', message: `Looking up ${zip}...` });

    const applyLocation = (location, status, message) => {
      if (!active) {
        return;
      }

      setForm((current) => ({
        ...current,
        city: location?.city || '',
        state: location?.state || '',
      }));
      setZipLookup({ status, message });
    };

    api.lookupZip(zip)
      .then((lookupResult) => {
        const fallbackLocation = riskFactorsData[zip] || null;
        const location = lookupResult || fallbackLocation;

        if (location) {
          const status = lookupResult ? 'resolved' : 'fallback';
          const source = lookupResult ? 'ZIP lookup service' : 'fallback profile';
          applyLocation(location, status, `${location.city}, ${location.state} loaded from ${source}.`);
          return;
        }

        applyLocation(null, 'manual', 'We could not auto-populate that ZIP yet. Enter city and state manually.');
      })
      .catch(() => {
        const fallbackLocation = riskFactorsData[zip] || null;

        if (fallbackLocation) {
          applyLocation(
            fallbackLocation,
            'fallback',
            `${fallbackLocation.city}, ${fallbackLocation.state} loaded from fallback profile.`
          );
          return;
        }

        applyLocation(null, 'manual', 'ZIP lookup is unavailable right now. Enter city and state manually.');
      });

    return () => {
      active = false;
    };
  }, [form.zip]);

  const updateField = useCallback((field) => (event) => {
    const rawValue = event.target.value;

    setForm((current) => {
      if (field === 'zip') {
        const nextZip = normalizeZip(rawValue);
        return {
          ...current,
          zip: nextZip,
          city: '',
          state: '',
        };
      }

      if (field === 'state') {
        return {
          ...current,
          state: normalizeState(rawValue),
        };
      }

      return {
        ...current,
        [field]: rawValue,
      };
    });
  }, []);

  const formData = useMemo(() => ({
    name: form.name.trim(),
    type: form.type,
    zip: form.zip.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    monthlyRevenue: Number(form.monthlyRevenue),
    employees: Number(form.employees),
  }), [form]);

  const stageValidity = useMemo(() => ({
    identity: Boolean(formData.name && formData.type),
    location: Boolean(/^\d{5}$/.test(formData.zip) && formData.city && formData.state),
    financials: Boolean(isPositiveNumber(formData.monthlyRevenue) && isPositiveNumber(formData.employees)),
  }), [formData]);

  const stepCompletion = useMemo(() => ([
    stageValidity.identity,
    stageValidity.location,
    stageValidity.financials,
    stageValidity.identity && stageValidity.location && stageValidity.financials,
  ]), [stageValidity]);

  const isFormReady = stepCompletion[3];

  const summaryRows = useMemo(() => ([
    { label: 'Business', value: formData.name || 'Not set yet' },
    { label: 'Type', value: getBusinessTypeDisplayLabel(businessTypeOptions.find((item) => item.id === formData.type)) },
    { label: 'Location', value: formData.city && formData.state ? `${formData.city}, ${formData.state} ${formData.zip}` : 'Pending ZIP lookup' },
    { label: 'Financials', value: formData.monthlyRevenue > 0 && formData.employees > 0 ? `$${formData.monthlyRevenue.toLocaleString()} monthly revenue - ${formData.employees} employees` : 'Pending financial inputs' },
  ]), [businessTypeOptions, formData]);

  const firstInvalidStep = useMemo(() => {
    if (!stageValidity.identity) return 0;
    if (!stageValidity.location) return 1;
    if (!stageValidity.financials) return 2;
    return -1;
  }, [stageValidity]);

  const validateForm = useCallback(() => {
    if (firstInvalidStep !== -1) {
      setActiveStep(firstInvalidStep);
      return false;
    }

    return true;
  }, [firstInvalidStep]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm() || !isFormReady) {
      return;
    }

    clearPendingPlaidSession();
    await onboard(formData);
  };

  const goToNextStep = () => {
    if (activeStep === 0 && !stageValidity.identity) {
      return;
    }

    if (activeStep === 1 && !stageValidity.location) {
      return;
    }

    if (activeStep === 2 && !stageValidity.financials) {
      return;
    }

    setActiveStep((current) => Math.min(current + 1, STEP_META.length - 1));
  };

  const goToPreviousStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const currentStepCanAdvance = activeStep === 0
    ? stageValidity.identity
    : activeStep === 1
      ? stageValidity.location
      : activeStep === 2
        ? stageValidity.financials
        : isFormReady;

  const canEditLocationManually = zipLookup.status === 'manual' || zipLookup.status === 'idle';

  const stageFooterMessage = activeStep === 1
    ? zipLookup.message
    : activeStep === 0
      ? 'Choose the business identity first so SafeGuard can tailor the next steps.'
      : activeStep === 2
        ? 'Set your current monthly revenue and team size to unlock the final connection options.'
        : 'Choose how you want to enter the app: use Plaid, continue with local or demo-backed context, or load the full demo.';

  const activeBusinessType = businessTypeOptions.find((item) => item.id === form.type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="flex min-h-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="glass-card flex h-[min(920px,calc(100dvh-1rem))] w-full max-w-4xl flex-col overflow-hidden p-4 shadow-2xl sm:h-[min(920px,calc(100dvh-2rem))] sm:p-8"
        >
          <div className="mb-6 flex shrink-0 flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="surface-panel flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-text-secondary">Onboarding flow</p>
                <h1 className="mt-1 text-4xl font-heading font-thin tracking-[-0.04em] text-text-primary sm:text-5xl">
                  Welcome to SafeGuard
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
                  Build your business profile in a few guided steps, let SafeGuard resolve your location context, then choose whether to start with Plaid or continue with fallback data.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {STEP_META.map((step, index) => (
                <StepPill
                  key={step.id}
                  step={step}
                  index={index}
                  active={activeStep === index}
                  complete={stepCompletion[index]}
                  enabled={index <= Math.max(activeStep, firstInvalidStep === -1 ? STEP_META.length - 1 : firstInvalidStep + 1)}
                  onClick={() => {
                    if (index <= Math.max(activeStep, firstInvalidStep === -1 ? STEP_META.length - 1 : firstInvalidStep + 1)) {
                      setActiveStep(index);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <AnimatePresence mode="wait">
                {activeStep === 0 ? (
                  <motion.div
                    key="step-identity"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <QuestionShell
                      eyebrow="Step 1 of 4"
                      title="Tell us what business we are protecting."
                      description="Start with the basics so we can shape the rest of the onboarding around your business profile."
                      icon={Building2}
                    >
                      <div className="grid gap-4">
                        <SignalInput
                          label="Business name"
                          value={form.name}
                          onChange={updateField('name')}
                          placeholder="Marias Bakery"
                          icon={Building2}
                        />

                        <div className="grid gap-3 md:grid-cols-2">
                          {businessTypeOptions.map((businessType) => (
                            <BusinessTypeCard
                              key={businessType.id}
                              businessType={businessType}
                              selected={form.type === businessType.id}
                              onSelect={() => {
                                setForm((current) => ({
                                  ...current,
                                  type: businessType.id,
                                }));
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </QuestionShell>
                  </motion.div>
                ) : null}

                {activeStep === 1 ? (
                  <motion.div
                    key="step-location"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <QuestionShell
                      eyebrow="Step 2 of 4"
                      title="Pin the location and load the risk profile."
                      description="ZIP code drives your city and state, location risk context, and the assumptions SafeGuard uses everywhere else."
                      icon={MapPin}
                      accent={zipLookup.status === 'resolved' || zipLookup.status === 'fallback' ? 'covered' : 'primary'}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                          <SignalInput
                            label="ZIP code"
                            value={form.zip}
                            onChange={updateField('zip')}
                            placeholder="77004"
                            icon={MapPin}
                            inputMode="numeric"
                            maxLength={5}
                          />

                          <div className={`surface-panel rounded-3xl p-4 ${
                            zipLookup.status === 'resolved' || zipLookup.status === 'fallback'
                              ? 'border-covered/25 bg-covered/10'
                              : zipLookup.status === 'manual'
                                ? 'border-underinsured/25 bg-underinsured/10'
                                : ''
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="surface-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                                {zipLookup.status === 'loading' ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : zipLookup.status === 'resolved' || zipLookup.status === 'fallback' ? (
                                  <CheckCircle2 className="h-4 w-4 text-covered" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-text-secondary">Location status</p>
                                <p className="mt-2 text-sm text-text-primary">{zipLookup.message}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <motion.div
                          layout
                          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
                        >
                          <SignalInput
                            label="City"
                            value={form.city}
                            onChange={updateField('city')}
                            placeholder={canEditLocationManually ? 'Enter city' : 'Auto-filled'}
                            icon={Building2}
                            readOnly={!canEditLocationManually}
                            disabled={zipLookup.status === 'loading'}
                          />
                          <SignalInput
                            label="State"
                            value={form.state}
                            onChange={updateField('state')}
                            placeholder={canEditLocationManually ? 'State' : 'Auto-filled'}
                            icon={MapPin}
                            readOnly={!canEditLocationManually}
                            disabled={zipLookup.status === 'loading'}
                            maxLength={2}
                          />
                        </motion.div>
                      </div>
                    </QuestionShell>
                  </motion.div>
                ) : null}

                {activeStep === 2 ? (
                  <motion.div
                    key="step-financials"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <QuestionShell
                      eyebrow="Step 3 of 4"
                      title="Set your financial baseline."
                      description="These numbers give SafeGuard the operating context it needs for reserve guidance, gap prioritization, and Plaid comparisons."
                      icon={BadgeDollarSign}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <SignalInput
                          label="Monthly revenue ($)"
                          value={form.monthlyRevenue}
                          onChange={updateField('monthlyRevenue')}
                          placeholder="9628"
                          type="number"
                          icon={BadgeDollarSign}
                        />
                        <SignalInput
                          label="Employees"
                          value={form.employees}
                          onChange={updateField('employees')}
                          placeholder="8"
                          type="number"
                          icon={Users}
                        />
                      </div>
                    </QuestionShell>
                  </motion.div>
                ) : null}

                {activeStep === 3 ? (
                  <motion.div
                    key="step-connect"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <QuestionShell
                      eyebrow="Step 4 of 4"
                      title="Choose how you want to enter the app."
                      description="Your profile is ready. Start with Plaid for live balances or continue with the fallback-backed business context."
                      icon={activeBusinessType ? getBusinessTypeIcon(activeBusinessType.id) : BriefcaseBusiness}
                      accent="covered"
                    >
                      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-3">
                          {summaryRows.map((row) => (
                            <SummaryRow key={row.label} label={row.label} value={row.value} />
                          ))}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                          <div className="surface-panel rounded-3xl p-4">
                            <div className="mb-4 flex items-start gap-3">
                              <div className="surface-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                                <Database className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Continue without Plaid</p>
                                <p className="mt-1 text-xs leading-6 text-text-secondary">
                                  Start with API-enriched business context and local fallback financial data. You can still analyze risk and coverage immediately.
                                </p>
                              </div>
                            </div>

                            <RippleButton
                              type="submit"
                              variant="secondary"
                              size="lg"
                              disabled={loading}
                              className="w-full"
                            >
                              {loading ? 'Preparing profile...' : 'Continue without Plaid'}
                            </RippleButton>
                          </div>

                          <PlaidConnect
                            formData={formData}
                            isFormReady={isFormReady}
                            validateForm={validateForm}
                          />
                        </div>
                      </div>
                    </QuestionShell>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex shrink-0 flex-col gap-4 border-t border-white/10 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-secondary">{stageFooterMessage}</p>

                {activeStep < 3 ? (
                  <div className="flex items-center gap-3 self-end">
                    <RippleButton
                      type="button"
                      variant="secondary"
                      onClick={goToPreviousStep}
                      disabled={activeStep === 0}
                      icon={ArrowLeft}
                    >
                      Back
                    </RippleButton>
                    <RippleButton
                      type="button"
                      variant="primary"
                      onClick={goToNextStep}
                      disabled={!currentStepCanAdvance || (activeStep === 1 && zipLookup.status === 'loading')}
                      icon={ArrowRight}
                    >
                      {activeStep === 2 ? 'Review Options' : 'Next'}
                    </RippleButton>
                  </div>
                ) : (
                  <RippleButton
                    type="button"
                    variant="secondary"
                    onClick={goToPreviousStep}
                    icon={ArrowLeft}
                    className="self-end"
                  >
                    Back to details
                  </RippleButton>
                )}
              </div>

              <div className="flex justify-center border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    clearPendingPlaidSession();
                    void loadDemo();
                  }}
                  disabled={loading}
                  className="surface-chip focus-ring-brand rounded-full px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Loading demo...' : 'Load Demo - Marias Bakery (Houston, TX)'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
