import { useState, useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import businessTypes from '../data/businessTypes.json';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-text-primary">Welcome to SafeGuard</h1>
        </div>
        <p className="text-text-secondary mb-6">Let's set up your business profile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Name</label>
            <input type="text" value={form.name} onChange={update('name')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Type</label>
            <select value={form.type} onChange={update('type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.icon} {bt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Zip Code</label>
            <input type="text" value={form.zip} onChange={update('zip')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Monthly Revenue ($)</label>
              <input type="number" value={form.monthlyRevenue} onChange={update('monthlyRevenue')} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Employees</label>
              <input type="number" value={form.employees} onChange={update('employees')} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <button type="submit"
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition mt-2">
            Get Started
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button onClick={loadDemo}
            className="text-sm text-primary hover:underline font-medium">
            Load Demo — Maria's Bakery (Houston, TX)
          </button>
        </div>
      </div>
    </div>
  );
}
