import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import businessTypes from '../data/businessTypes.json';
import RippleButton from './shared/RippleButton';

export default function Onboarding() {
  const { onboard, loadDemo } = useContext(AppContext);
  const [form, setForm] = useState({
    name: '', type: 'restaurant', zip: '', monthlyRevenue: '', employees: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboard({
      name: form.name,
      type: form.type,
      zip: form.zip,
      city: '',
      state: '',
      monthlyRevenue: Number(form.monthlyRevenue),
      employees: Number(form.employees),
    });
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card w-full max-w-md p-8 shadow-2xl"
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="surface-panel flex h-12 w-12 items-center justify-center rounded-xl">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome to SafeGuard</h1>
        </div>
        <p className="readable-copy mb-6">Let&apos;s set up your business profile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Business Name</label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              required
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
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id} className="bg-bg-main">{bt.icon} {bt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Zip Code</label>
            <input
              type="text"
              value={form.zip}
              onChange={update('zip')}
              required
              className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Monthly Revenue ($)</label>
              <input
                type="number"
                value={form.monthlyRevenue}
                onChange={update('monthlyRevenue')}
                required
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
                className="control-input focus-ring-brand w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted transition-all duration-200"
              />
            </div>
          </div>

          <RippleButton
            type="submit"
            variant="primary"
            size="lg"
            className="mt-2 w-full"
          >
            Get Started
          </RippleButton>
        </form>

        <div className="mt-4 border-t border-white/10 pt-4 text-center">
          <button
            type="button"
            onClick={loadDemo}
            className="surface-chip focus-ring-brand rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            Load Demo - Maria&apos;s Bakery (Houston, TX)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
