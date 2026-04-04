import { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { api } from '../services/apiClient';
import fallbackBusinessTypes from '../data/businessTypes.json';
import fallbackRiskFactors from '../data/riskFactors.json';

export default function Onboarding() {
  const { onboard, loadDemo, loading } = useContext(AppContext);
  const [businessTypeOptions, setBusinessTypeOptions] = useState(fallbackBusinessTypes);
  const [form, setForm] = useState({
    name: '',
    type: 'restaurant',
    zip: '',
    city: '',
    state: '',
    monthlyRevenue: '',
    employees: '',
  });

  useEffect(() => {
    let active = true;

    api.getBusinessTypes()
      .then((types) => {
        if (active && Array.isArray(types) && types.length > 0) {
          setBusinessTypeOptions(types);
        }
      })
      .catch(() => {
        if (active) {
          setBusinessTypeOptions(fallbackBusinessTypes);
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

        const localRiskData = fallbackRiskFactors[zip];
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onboard({
      name: form.name,
      type: form.type,
      zip: form.zip,
      city: form.city,
      state: form.state,
      monthlyRevenue: Number(form.monthlyRevenue),
      employees: Number(form.employees),
    });
  };

  const update = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'zip' && value.trim().length < 5 ? { city: '', state: '' } : {}),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome to SafeGuard</h1>
        </div>
        <p className="mb-6 text-text-secondary">Set up your business profile to generate a risk-aware coverage review.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Business Name</label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Business Type</label>
            <select
              value={form.type}
              onChange={update('type')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {businessTypeOptions.map((businessType) => (
                <option key={businessType.id} value={businessType.id}>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">City</label>
              <input
                type="text"
                value={form.city}
                readOnly
                placeholder="Auto-filled"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-secondary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">State</label>
              <input
                type="text"
                value={form.state}
                readOnly
                placeholder="Auto-filled"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Monthly Revenue ($)</label>
              <input
                type="number"
                value={form.monthlyRevenue}
                onChange={update('monthlyRevenue')}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Employees</label>
              <input
                type="number"
                value={form.employees}
                onChange={update('employees')}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-primary py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Loading...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-4 border-t border-gray-100 pt-4 text-center">
          <button
            onClick={() => void loadDemo()}
            disabled={loading}
            className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
          >
            {loading ? 'Loading demo...' : "Load Demo - Maria's Bakery (Houston, TX)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
