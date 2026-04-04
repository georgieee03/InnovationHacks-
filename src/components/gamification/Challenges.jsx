import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, CheckCircle, Circle, Zap, Shield, Calculator, Search } from 'lucide-react';

const CHALLENGES = [
  { id: 'upload-policy', title: 'Upload your insurance policy', description: 'Add your current policy for analysis', points: 50, difficulty: 'easy', category: 'insurance' },
  { id: 'review-gaps', title: 'Review your coverage gaps', description: 'Check the gap analysis results', points: 30, difficulty: 'easy', category: 'insurance' },
  { id: 'calc-emergency', title: 'Calculate your emergency fund target', description: 'Use the emergency fund calculator', points: 40, difficulty: 'easy', category: 'financial' },
  { id: 'continuity-plan', title: 'Create a business continuity plan', description: 'Document your disaster recovery steps', points: 80, difficulty: 'medium', category: 'planning' },
  { id: 'flood-quote', title: 'Get a flood insurance quote', description: 'Research flood coverage options', points: 60, difficulty: 'medium', category: 'insurance' },
  { id: 'security-cameras', title: 'Install security cameras or alarm', description: 'Improve physical security measures', points: 50, difficulty: 'medium', category: 'security' },
  { id: 'cloud-backups', title: 'Set up automatic cloud backups', description: 'Protect your business data', points: 40, difficulty: 'easy', category: 'tech' },
  { id: 'annual-review', title: 'Schedule annual policy review', description: 'Set a recurring reminder to review coverage', points: 70, difficulty: 'medium', category: 'insurance' },
];

const LEVEL_NAMES = { 1: 'Starter', 2: 'Protected', 3: 'Resilient', 4: 'Fortified', 5: 'Invincible' };

const BADGES = [
  { id: 'first-steps', title: 'First Steps', description: 'Completed first challenge', icon: Star, check: (c) => c.length >= 1 },
  { id: 'risk-aware', title: 'Risk Aware', description: 'Uploaded insurance policy', icon: Shield, check: (c) => c.includes('upload-policy') },
  { id: 'calculator-pro', title: 'Calculator Pro', description: 'Used all 3 calculators', icon: Calculator, check: (c) => c.includes('calc-emergency') },
  { id: 'fully-analyzed', title: 'Fully Analyzed', description: 'Completed gap analysis', icon: Search, check: (c) => c.includes('review-gaps') },
];

const DIFFICULTY_COLORS = { easy: 'bg-green-100 text-covered', medium: 'bg-yellow-100 text-underinsured', hard: 'bg-red-100 text-gap' };
const STORAGE_KEY = 'safeguard-challenges';

export default function Challenges() {
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [animatingPoints, setAnimatingPoints] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }, [completed]);

  const totalPoints = CHALLENGES.filter((c) => completed.includes(c.id)).reduce((s, c) => s + c.points, 0);
  const level = Math.min(5, Math.floor(totalPoints / 100) + 1);
  const pointsInLevel = totalPoints % 100;
  const levelName = LEVEL_NAMES[level] || 'Invincible';

  const toggle = useCallback((id) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    setCompleted((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (challenge) setAnimatingPoints(challenge.points);
      return [...prev, id];
    });
    if (challenge && !completed.includes(id)) {
      setTimeout(() => setAnimatingPoints(null), 1200);
    }
  }, [completed]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Resilience Challenges</h2>
      <p className="text-text-secondary text-sm mb-6">Complete challenges to level up your business resilience</p>

      {/* Points & Level */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Level {level}</p>
              <p className="text-xl font-bold text-text-primary">{levelName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <motion.span key={totalPoints} initial={{ scale: 1.4, color: '#3b82f6' }} animate={{ scale: 1, color: '#1e293b' }} transition={{ duration: 0.5 }} className="text-2xl font-bold">
                {totalPoints}
              </motion.span>
              <span className="text-text-secondary text-sm">pts</span>
            </div>
            {animatingPoints && (
              <motion.span initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }} transition={{ duration: 1 }} className="text-primary text-sm font-bold">
                +{animatingPoints}
              </motion.span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Level {level}</span>
          <span>{level < 5 ? `${pointsInLevel}/100 to Level ${level + 1}` : 'Max Level!'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div initial={{ width: 0 }} animate={{ width: `${level >= 5 ? 100 : pointsInLevel}%` }} transition={{ duration: 0.6 }} className="h-3 rounded-full bg-primary" />
        </div>
      </motion.div>

      {/* Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {BADGES.map((badge) => {
          const unlocked = badge.check(completed);
          const Icon = badge.icon;
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} className={`bg-card rounded-xl shadow-sm p-4 text-center border-2 transition ${unlocked ? 'border-primary' : 'border-gray-100 opacity-50'}`}>
              <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${unlocked ? 'bg-primary/10' : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${unlocked ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <p className="text-sm font-semibold text-text-primary">{badge.title}</p>
              <p className="text-xs text-text-secondary">{badge.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Challenge List */}
      <div className="space-y-3">
        {CHALLENGES.map((challenge, i) => {
          const done = completed.includes(challenge.id);
          return (
            <motion.div key={challenge.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.01 }} onClick={() => toggle(challenge.id)} className={`bg-card rounded-xl shadow-sm p-4 flex items-center gap-4 cursor-pointer border-2 transition ${done ? 'border-covered/30 bg-green-50/50' : 'border-transparent hover:border-gray-200'}`}>
              {done ? <CheckCircle className="w-6 h-6 text-covered flex-shrink-0" /> : <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{challenge.title}</p>
                <p className="text-xs text-text-secondary">{challenge.description}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[challenge.difficulty]}`}>{challenge.difficulty}</span>
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Zap className="w-4 h-4" /> {challenge.points}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
