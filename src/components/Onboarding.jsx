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
      name: form.name, type: form.type, zip: form.zip,
      city: '', state: '',
      monthlyRevenue: Number(form.monthlyRevenue),
      employees: Number(form.employees),
    });
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome to SafeGuard</h1>
        </div>
        <p className="text-text-secondary mb-6">Let's set up your business profile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Name</label>
            <input type="text" value={form.name} onChange={update('name')} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Type</label>
            <select value={form.type} onChange={update('type')} className={inputClass}>
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id} className="bg-bg-main">{bt.icon} {bt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Zip Code</label>
            <input type="text" value={form.zip} onChange={update('zip')} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Monthly Revenue ($)</label>
              <input type="number" value={form.monthlyRevenue} onChange={update('monthlyRevenue')} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Employees</label>
              <input type="number" value={form.employees} onChange={update('employees')} required className={inputClass} />
            </div>
          </div>
          <RippleButton type="submit" variant="primary" size="lg" className="w-full mt-2">Get Started</RippleButton>
        </form>

        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <button onClick={loadDemo} className="text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors duration-200">
            Load Demo — Maria's Bakery (Houston, TX)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
