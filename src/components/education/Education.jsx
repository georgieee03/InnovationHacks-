import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, XCircle, Award, ArrowLeft, Zap } from 'lucide-react';
import RiskSimulator from '../simulator/RiskSimulator';

const TRACKS = [
  {
    id: 'insurance-basics',
    title: 'Insurance Basics',
    description: 'Understand the core types of business insurance and what they cover.',
    lessons: [
      {
        id: 'gl',
        title: 'What is General Liability?',
        content: `General Liability (GL) insurance is the foundation of most business insurance programs. It protects your business when someone claims they were injured on your premises, or that your business caused damage to their property. Think of it as your first line of defense against lawsuits from customers, vendors, or passersby.\n\nGL typically covers medical expenses for injured parties, legal defense costs, and settlements or judgments. For example, if a customer slips on a wet floor in your shop, GL would cover their medical bills and any legal costs if they sue. Most landlords and contracts require you to carry GL before you can lease a space or take on a project.`,
      },
      {
        id: 'property-flood',
        title: 'Property vs Flood Insurance',
        content: `Property insurance covers your building, equipment, inventory, and furniture against perils like fire, theft, vandalism, and certain weather events. It's essential for any business with physical assets. However, there's a critical gap most owners don't realize: standard property insurance almost never covers flood damage.\n\nFlood insurance is a separate policy, often backed by the National Flood Insurance Program (NFIP). Even if you're not in a high-risk flood zone, floods can happen anywhere — a single inch of water can cause $25,000 in damage. If your business is in a flood-prone area, this coverage isn't optional — it's survival. Check your FEMA flood map to understand your zone and get a quote.`,
      },
      {
        id: 'workers-comp',
        title: "Workers' Comp Explained",
        content: `Workers' Compensation insurance covers medical expenses and lost wages for employees who get injured or sick on the job. In most states, it's legally required as soon as you hire your first employee — even part-time or seasonal workers may count.\n\nWorkers' comp protects both sides: your employee gets their medical bills paid and partial wage replacement without having to sue, and your business is protected from potentially devastating lawsuits. Premiums are based on your industry risk classification, payroll size, and claims history. A bakery pays different rates than a construction company. Even if your state doesn't require it, carrying workers' comp is smart risk management.`,
      },
    ],
    quiz: [
      { question: 'What does General Liability insurance primarily protect against?', options: ['Employee injuries on the job', 'Third-party claims of injury or property damage', 'Flood damage to your building', 'Lost income during a shutdown'], correct: 1 },
      { question: 'Why is flood insurance typically a separate policy?', options: ['It costs too much to bundle', 'Standard property insurance excludes flood damage', 'Only coastal businesses need it', 'The government requires it to be separate'], correct: 1 },
      { question: "When is Workers' Compensation typically required?", options: ['Only for businesses with 10+ employees', 'Only for high-risk industries', 'As soon as you hire your first employee in most states', 'Only if an employee requests it'], correct: 2 },
      { question: 'What does property insurance typically NOT cover?', options: ['Fire damage', 'Theft', 'Flood damage', 'Vandalism'], correct: 2 },
      { question: "Who benefits from Workers' Compensation?", options: ['Only the employer', 'Only the employee', 'Both employer and employee', 'Only the insurance company'], correct: 2 },
    ],
  },
  {
    id: 'risk-management',
    title: 'Risk Management 101',
    description: 'Learn to identify, assess, and mitigate the risks your business faces.',
    lessons: [
      {
        id: 'risk-profile',
        title: 'Understanding Your Risk Profile',
        content: `Your risk profile is a snapshot of all the threats your business faces and how vulnerable you are to each one. Three major factors shape it: location, industry, and size. A bakery in Houston faces hurricane and flood risks, while a tech startup in San Francisco worries more about earthquakes.\n\nIndustry matters too — a restaurant has fire and liability risks that a consulting firm doesn't. And size plays a role: more employees means more workers' comp exposure, more revenue means higher liability limits are needed. Understanding your unique risk profile is the first step to building the right insurance program and emergency plan.`,
      },
      {
        id: 'emergency-fund',
        title: 'Emergency Fund Basics',
        content: `Financial experts recommend every business maintain an emergency fund covering 3-6 months of operating expenses. This cash reserve is your buffer against unexpected events — a broken oven, a slow season, a pandemic, or an insurance claim that takes weeks to process.\n\nTo calculate your target, add up your monthly fixed costs (rent, utilities, payroll, insurance premiums, loan payments) and multiply by 3 for a minimum target and 6 for an ideal one. Start by automatically setting aside 5-10% of monthly revenue. Even a small fund provides peace of mind and prevents you from taking on high-interest debt in a crisis.`,
      },
      {
        id: 'continuity',
        title: 'Business Continuity Planning',
        content: `A Business Continuity Plan (BCP) is your playbook for keeping operations running — or getting back up quickly — after a disruption. It covers everything from natural disasters to cyberattacks to key employee departures.\n\nA good BCP answers critical questions: Where will you operate if your location is damaged? How will you communicate with customers and employees? What's the minimum you need to keep revenue flowing? Start simple — document your critical processes, identify backup suppliers, set up cloud backups for important data, and establish a communication chain. Review and update your plan annually. The businesses that recover fastest from disasters are the ones that planned ahead.`,
      },
    ],
    quiz: [
      { question: 'What three factors most shape your business risk profile?', options: ['Revenue, profit, and debt', 'Location, industry, and size', 'Age, experience, and education', 'Marketing, sales, and operations'], correct: 1 },
      { question: 'How many months of expenses should an emergency fund cover?', options: ['1-2 months', '3-6 months', '12 months', 'It depends on your credit score'], correct: 1 },
      { question: 'What is a Business Continuity Plan?', options: ['A marketing strategy', 'A plan for keeping operations running after a disruption', 'An employee handbook', 'A financial audit'], correct: 1 },
      { question: 'What should you include when calculating your emergency fund target?', options: ['Only rent', 'Only payroll', 'All monthly fixed costs', 'Just variable expenses'], correct: 2 },
      { question: 'How often should you review your Business Continuity Plan?', options: ['Only when something goes wrong', 'Every 5 years', 'Annually', 'Never — once is enough'], correct: 2 },
    ],
  },
  {
    id: 'smart-coverage',
    title: 'Smart Coverage Decisions',
    description: 'Make informed choices about your insurance policies and save money.',
    lessons: [
      {
        id: 'reading-policy',
        title: 'Reading Your Policy',
        content: `Insurance policies can feel like they're written in another language, but understanding a few key terms unlocks the whole document. Your policy limit is the maximum the insurer will pay — per occurrence and in aggregate (total per year). Your deductible is what you pay out of pocket before insurance kicks in.\n\nExclusions are just as important as what's covered — they list specific situations the policy won't pay for. Common exclusions include intentional acts, wear and tear, and (in property policies) flood and earthquake. Always read the declarations page first — it's the summary showing your coverages, limits, deductibles, and premium. If something doesn't make sense, ask your agent to explain it in plain English.`,
      },
      {
        id: 'upgrade-coverage',
        title: 'When to Upgrade Coverage',
        content: `Several triggers should prompt you to review and potentially increase your coverage limits. Revenue growth is a big one — if your business has grown significantly, your original limits may no longer be adequate. Hiring employees, signing a lease, or taking on larger contracts often come with minimum insurance requirements.\n\nOther triggers include adding expensive equipment, expanding to a new location, or entering a higher-risk line of work. A good rule of thumb: review your coverage annually and after any major business change. Underinsurance is one of the most common and dangerous gaps — you don't want to discover your limits are too low when you're filing a claim.`,
      },
      {
        id: 'bundling',
        title: 'Bundling & Saving',
        content: `A Business Owner's Policy (BOP) bundles General Liability and Property insurance into a single policy, usually at a 10-20% discount compared to buying them separately. For many small businesses, a BOP is the most cost-effective way to get essential coverage.\n\nBeyond BOPs, multi-policy discounts are common — carrying your GL, property, commercial auto, and umbrella with the same insurer often earns you 5-15% off each policy. Other ways to save: increase your deductible (if you have the cash reserves to cover it), implement safety programs that reduce claims, and shop your coverage every 2-3 years to ensure competitive pricing. Just don't sacrifice necessary coverage to save a few dollars — the cheapest policy isn't always the best value.`,
      },
    ],
    quiz: [
      { question: 'What is a policy deductible?', options: ['The monthly premium you pay', 'The maximum the insurer will pay', 'What you pay out of pocket before insurance kicks in', 'A discount for bundling policies'], correct: 2 },
      { question: 'Which of these is a common trigger to upgrade coverage?', options: ['Reducing your workforce', 'Significant revenue growth', 'Moving to a smaller office', 'Canceling a contract'], correct: 1 },
      { question: 'What does a Business Owner\'s Policy (BOP) bundle?', options: ['Workers\' Comp and Auto', 'General Liability and Property', 'Health and Life insurance', 'Flood and Earthquake'], correct: 1 },
      { question: 'What section of your policy should you read first?', options: ['The exclusions', 'The fine print at the end', 'The declarations page', 'The endorsements'], correct: 2 },
      { question: 'How often should you shop your insurance coverage?', options: ['Never — loyalty gets you the best rates', 'Every 2-3 years', 'Every month', 'Only when you have a claim'], correct: 1 },
    ],
  },
];

const STORAGE_KEY = 'safeguard-education';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function TrackCard({ track, progress, onSelect }) {
  const lessonsViewed = progress.lessonsViewed || [];
  const quizPassed = progress.quizPassed || false;
  const pct = Math.round((lessonsViewed.length / track.lessons.length) * 100);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        {quizPassed && (
          <span className="flex items-center gap-1 text-xs font-medium text-covered bg-covered/10 px-2 py-1 rounded-full">
            <Award className="w-3 h-3" /> Completed
          </span>
        )}
      </div>
      <h3 className="font-heading font-bold text-text-primary mb-1">{track.title}</h3>
      <p className="text-sm text-text-secondary mb-4">{track.description}</p>
      <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
        <span>{track.lessons.length} lessons + quiz</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

function LessonAccordion({ lesson, isViewed, onView }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen(prev => !prev);
    if (!isViewed) onView();
  };

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          {isViewed ? (
            <CheckCircle className="w-5 h-5 text-covered flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {lesson.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Quiz({ track, onPass }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const q = track.quiz[current];
  const totalQuestions = track.quiz.length;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    if (current + 1 < totalQuestions) {
      setCurrent(current + 1);
    } else {
      setShowResults(true);
      const score = newAnswers.filter((a, i) => a === track.quiz[i].correct).length;
      if (score / totalQuestions >= 0.7) onPass();
    }
  };

  if (showResults) {
    const score = answers.filter((a, i) => a === track.quiz[i].correct).length;
    const passed = score / totalQuestions >= 0.7;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-covered/10' : 'bg-gap/10'}`}>
          {passed ? <Award className="w-8 h-8 text-covered" /> : <XCircle className="w-8 h-8 text-gap" />}
        </div>
        <h3 className="font-heading font-bold text-xl text-text-primary mb-2">
          {passed ? 'Congratulations!' : 'Keep Learning!'}
        </h3>
        <p className="text-text-secondary mb-1">
          You scored {score}/{totalQuestions} ({Math.round((score / totalQuestions) * 100)}%)
        </p>
        <p className="text-sm text-text-secondary">
          {passed ? 'You passed! This track is now complete.' : 'You need 70% to pass. Review the lessons and try again.'}
        </p>
        {!passed && (
          <button
            onClick={() => { setCurrent(0); setSelected(null); setAnswers([]); setShowResults(false); }}
            className="mt-4 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition"
          >
            Retry Quiz
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
        <span>Question {current + 1} of {totalQuestions}</span>
        <span>{Math.round(((current) / totalQuestions) * 100)}% complete</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(current / totalQuestions) * 100}%` }} />
      </div>
      <p className="font-medium text-text-primary">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = 'border-gray-200 hover:border-primary/40 hover:bg-primary/5';
          if (selected !== null) {
            if (idx === q.correct) style = 'border-covered bg-covered/5 text-covered';
            else if (idx === selected) style = 'border-gap bg-gap/5 text-gap';
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition"
          >
            {current + 1 < totalQuestions ? 'Next Question' : 'See Results'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function TrackDetail({ track, progress, onBack, onUpdate }) {
  const lessonsViewed = progress.lessonsViewed || [];
  const quizPassed = progress.quizPassed || false;
  const allLessonsViewed = track.lessons.every(l => lessonsViewed.includes(l.id));
  const [showQuiz, setShowQuiz] = useState(false);

  const markViewed = (lessonId) => {
    if (lessonsViewed.includes(lessonId)) return;
    onUpdate({ ...progress, lessonsViewed: [...lessonsViewed, lessonId] });
  };

  const handleQuizPass = () => {
    onUpdate({ ...progress, quizPassed: true });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back to tracks
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-text-primary">{track.title}</h2>
          <p className="text-sm text-text-secondary">{track.lessons.length} lessons · {track.quiz.length}-question quiz</p>
        </div>
        {quizPassed && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-covered bg-covered/10 px-2 py-1 rounded-full">
            <Award className="w-3 h-3" /> Passed
          </span>
        )}
      </div>

      <div className="space-y-2 mb-6">
        {track.lessons.map((lesson) => (
          <LessonAccordion
            key={lesson.id}
            lesson={lesson}
            isViewed={lessonsViewed.includes(lesson.id)}
            onView={() => markViewed(lesson.id)}
          />
        ))}
      </div>

      {!quizPassed && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100">
          {!allLessonsViewed ? (
            <div className="text-center py-4">
              <p className="text-sm text-text-secondary">Complete all lessons to unlock the quiz.</p>
              <p className="text-xs text-text-secondary mt-1">{lessonsViewed.length}/{track.lessons.length} lessons viewed</p>
            </div>
          ) : !showQuiz ? (
            <div className="text-center py-4">
              <p className="text-sm text-text-primary font-medium mb-3">All lessons complete! Ready for the quiz?</p>
              <button
                onClick={() => setShowQuiz(true)}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition"
              >
                Start Quiz
              </button>
            </div>
          ) : (
            <Quiz track={track} onPass={handleQuizPass} />
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Education() {
  const [progress, setProgress] = useState(loadProgress);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateTrackProgress = (trackId, trackProgress) => {
    setProgress(prev => ({ ...prev, [trackId]: trackProgress }));
  };

  if (showSimulator) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setShowSimulator(false)} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Learning Center
        </button>
        <RiskSimulator />
      </div>
    );
  }

  if (selectedTrack) {
    const track = TRACKS.find(t => t.id === selectedTrack);
    return (
      <div className="max-w-3xl mx-auto">
        <TrackDetail
          track={track}
          progress={progress[track.id] || {}}
          onBack={() => setSelectedTrack(null)}
          onUpdate={(p) => updateTrackProgress(track.id, p)}
        />
      </div>
    );
  }

  const completedCount = TRACKS.filter(t => progress[t.id]?.quizPassed).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-xl text-text-primary">Learning Center</h2>
          <p className="text-sm text-text-secondary">Build your insurance & risk management knowledge</p>
        </div>
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Award className="w-4 h-4" /> {completedCount}/{TRACKS.length} tracks completed
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TRACKS.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            progress={progress[track.id] || {}}
            onSelect={() => setSelectedTrack(track.id)}
          />
        ))}
      </div>

      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => setShowSimulator(true)}
        className="mt-6 bg-card rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-underinsured/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-underinsured" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-text-primary mb-1">Simulated Learning</h3>
            <p className="text-sm text-text-secondary">
              See how your finances would react to different risks using your connected account data. Stress-test real disruptions and understand your coverage gaps.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary mt-1 flex-shrink-0" />
        </div>
      </motion.div>
    </div>
  );
}
