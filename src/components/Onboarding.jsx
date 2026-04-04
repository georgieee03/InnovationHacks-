import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Sparkles } from 'lucide-react';
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

export default function Onboarding() {
  const { onboard, loadDemo, loading } = useContext(AppContext);
  const formRef = useRef(null);
  const [businessTypeOptions, setBusinessTypeOptions] = useState(businessTypes);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    ...(getStoredPlaidFormData() || {}),
  }));

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
      return undefined;
    }

    let active = true;

    api.getRiskFactors(zip)
      .then((riskData) => {
        if (!active || !riskData) {
          return;
        }

        setForm((current) => ({
          ...current,
          city: riskData.city || '',
          state: riskData.state || '',
        }));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        const localRiskData = riskFactorsData[zip];
        setForm((current) => ({
          ...current,
          city: localRiskData?.city || '',
          state: localRiskData?.state || '',
        }));
      });

    return () => {
      active = false;
    };
  }, [form.zip]);

  const update = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'zip' && value.trim().length < 5 ? { city: '', state: '' } : {}),
    }));
  };

  const formData = useMemo(() => ({
    name: form.name.trim(),
    type: form.type,
    zip: form.zip.trim(),
    city: form.city,
    state: form.state,
    monthlyRevenue: Number(form.monthlyRevenue),
    employees: Number(form.employees),
  }), [form]);

  const isFormReady = Boolean(
    formData.name
    && formData.type
    && formData.zip
    && Number.isFinite(formData.monthlyRevenue)
    && formData.monthlyRevenue > 0
    && Number.isFinite(formData.employees)
    && formData.employees > 0
  );

  const validateForm = () => {
    if (!formRef.current) {
      return isFormReady;
    }

    return formRef.current.reportValidity() && isFormReady;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm() || !isFormReady) {
      return;
    }

    clearPendingPlaidSession();
    await onboard(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card w-full max-w-3xl p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="surface-panel flex h-12 w-12 items-center justify-center rounded-xl">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome to SafeGuard</h1>
            </div>
            <p className="readable-copy max-w-2xl">
              Set up your business profile, pull live business types and location risk data, then choose how to enter financials.
            </p>
          </div>

          <div className="surface-panel flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs text-text-secondary">
            <Sparkles className="h-4 w-4 text-primary" />
            Plaid starts here, not in the dashboard
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">Business Name</label>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                required
                minLength={2}
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Business Type</label>
              <select
                value={form.type}
                onChange={update('type')}
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary transition-all duration-200"
              >
                {businessTypeOptions.map((businessType) => (
                  <option key={businessType.id} value={businessType.id} className="bg-bg-main">
                    {businessType.icon} {businessType.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Zip Code</label>
              <input
                type="text"
                value={form.zip}
                onChange={update('zip')}
                inputMode="numeric"
                required
                pattern="[0-9]{5}"
                maxLength={5}
                title="Enter a 5-digit ZIP code."
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">City</label>
              <input
                type="text"
                value={form.city}
                readOnly
                placeholder="Auto-filled"
                className="control-input w-full rounded-lg px-3 py-2 text-sm text-text-secondary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">State</label>
              <input
                type="text"
                value={form.state}
                readOnly
                placeholder="Auto-filled"
                className="control-input w-full rounded-lg px-3 py-2 text-sm text-text-secondary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Monthly Revenue ($)</label>
              <input
                type="number"
                value={form.monthlyRevenue}
                onChange={update('monthlyRevenue')}
                required
                min="1"
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Employees</label>
              <input
                type="number"
                value={form.employees}
                onChange={update('employees')}
                required
                min="1"
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-panel rounded-2xl p-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="surface-chip flex h-10 w-10 items-center justify-center rounded-xl">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Continue without Plaid</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Start with API-enriched business context and local fallback data. You can still analyze risk and coverage immediately.
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

          {!isFormReady && (
            <p className="text-xs text-text-secondary">
              Enter your business name, 5-digit ZIP code, monthly revenue, and employee count to continue.
            </p>
          )}
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              clearPendingPlaidSession();
              void loadDemo();
            }}
            disabled={loading}
            className="surface-chip focus-ring-brand rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading demo...' : "Load Demo - Maria's Bakery (Houston, TX)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
