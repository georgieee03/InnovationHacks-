import { motion } from 'framer-motion';
import PolicyCard from './PolicyCard';

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

export default function GapAnalysis({ gaps }) {
  if (!gaps?.length) return null;

  const critical = gaps.filter(g => g.status === 'gap' && g.priority === 'critical');
  const underinsured = gaps.filter(g => g.status === 'underinsured');
  const covered = gaps.filter(g => g.status === 'covered');
  const other = gaps.filter(g => g.status === 'gap' && g.priority !== 'critical');

  let sectionIndex = 0;

  return (
    <div className="space-y-6">
      <motion.div
        {...fadeIn}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 text-sm"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gap" /> {critical.length + other.length} Gaps
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-underinsured" /> {underinsured.length} Underinsured
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-covered" /> {covered.length} Covered
        </span>
      </motion.div>

      {critical.length > 0 && (
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.4, delay: 0.1 * ++sectionIndex }}
        >
          <h3 className="text-lg font-heading font-semibold text-gap mb-3">Critical Gaps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critical.map((p, i) => <PolicyCard key={p.id} policy={p} delay={0.05 * i} />)}
          </div>
        </motion.div>
      )}

      {underinsured.length > 0 && (
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.4, delay: 0.1 * ++sectionIndex }}
        >
          <h3 className="text-lg font-heading font-semibold text-underinsured mb-3">Underinsured</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {underinsured.map((p, i) => <PolicyCard key={p.id} policy={p} delay={0.05 * i} />)}
          </div>
        </motion.div>
      )}

      {other.length > 0 && (
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.4, delay: 0.1 * ++sectionIndex }}
        >
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Recommended</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {other.map((p, i) => <PolicyCard key={p.id} policy={p} delay={0.05 * i} />)}
          </div>
        </motion.div>
      )}

      {covered.length > 0 && (
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.4, delay: 0.1 * ++sectionIndex }}
        >
          <h3 className="text-lg font-heading font-semibold text-covered mb-3">Adequately Covered</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {covered.map((p, i) => <PolicyCard key={p.id} policy={p} delay={0.05 * i} />)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
