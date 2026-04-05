import { useState } from 'react';
import { Loader2, HelpCircle, ArrowRight } from 'lucide-react';
import AmbientBackground from '../shared/AmbientBackground';
import RippleButton from '../shared/RippleButton';

const STEPS = [
  {
    id: 'businessDescription',
    question: 'What kind of business are you thinking about?',
    subtext: 'Just describe it in your own words — what you do, where, and who you\'d serve.',
    helpTip: 'This helps us figure out what licenses and permits you\'ll need, and what kind of business structure makes sense.',
    placeholder: 'e.g. I want to start a mobile car detailing business in Tempe, Arizona',
  },
  {
    id: 'workStructure',
    question: 'Will you be working alone, or do you plan to have help?',
    subtext: 'This affects how your business is set up legally and what tax forms you\'ll need.',
    options: [
      { label: 'Just me', hint: 'Simplest setup — you\'re the sole owner and operator' },
      { label: 'Hiring employees', hint: 'People who work set hours and use your tools/equipment' },
      { label: 'Business partner(s)', hint: 'Someone who co-owns the business with you' },
      { label: 'Using contractors', hint: 'Freelancers or helpers you hire per job' },
    ],
  },
  {
    id: 'personalAssets',
    question: 'Will you use your personal vehicle, home, or equipment for business?',
    subtext: 'This matters for insurance and tax deductions.',
    helpTip: 'A "write-off" means you can subtract part of the cost from your taxable income.',
    options: [
      { label: 'Personal vehicle', hint: 'You can deduct mileage or gas costs' },
      { label: 'Home office', hint: 'A dedicated workspace at home can be a deduction' },
      { label: 'Both vehicle and home', hint: 'Maximize your deductions' },
      { label: 'Neither — dedicated business space', hint: 'You\'ll rent or own a separate workspace' },
    ],
  },
  {
    id: 'incomeSource',
    question: 'Will this be your only income, or do you have another job?',
    subtext: 'This helps estimate your tax bracket and quarterly tax payments.',
    helpTip: 'Quarterly taxes are payments you send to the IRS every 3 months when self-employed.',
    options: [
      { label: 'This is a side project — I have a full-time job', hint: 'Your employer already withholds some taxes' },
      { label: 'This will be my only income', hint: 'You\'ll likely need to pay estimated quarterly taxes' },
      { label: 'I\'m transitioning from a job', hint: 'We\'ll help you plan the switch' },
    ],
  },
  {
    id: 'businessName',
    question: 'Have you picked a business name?',
    subtext: 'We\'ll check availability and domain options. No pressure if you haven\'t decided.',
    placeholder: 'e.g. Shine Pro Detailing (or leave blank)',
  },
  {
    id: 'estimatedRevenue',
    question: 'Roughly how much do you expect to bring in per month in the first year?',
    subtext: 'A ballpark is fine — this helps recommend the right structure and tax strategy.',
    helpTip: 'Revenue is the total money coming in before expenses.',
    options: [
      'Under $2,000/month',
      '$2,000–5,000/month',
      '$5,000–10,000/month',
      'Over $10,000/month',
      'No idea yet',
    ],
  },
  {
    id: 'helpDetails',
    question: 'Tell me about the help you\'ll need — what will they do and how often?',
    subtext: 'This helps classify them as employees or contractors. Getting this wrong can lead to fines.',
    helpTip: 'The IRS looks at: do they set their own hours? Use their own tools? If yes, likely a contractor.',
    placeholder: 'e.g. I\'ll hire a helper on weekends for 2-3 jobs, they\'ll use my equipment',
    showIf: (a) => a.workStructure === 'Hiring employees' || a.workStructure === 'Using contractors',
  },
];

export default function OnboardingChat({ onComplete, error }) {
  const [answers, setAnswers] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const visibleSteps = STEPS.filter((s) => !s.showIf || s.showIf(answers));
  const currentStep = visibleSteps[currentStepIndex];
  const progress = Math.round((currentStepIndex / visibleSteps.length) * 100);

  const handleAnswer = (value) => {
    const updated = { ...answers, [currentStep.id]: value };
    setAnswers(updated);
    setInputValue('');
    setShowHelp(false);

    const nextVisibleSteps = STEPS.filter((s) => !s.showIf || s.showIf(updated));
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= nextVisibleSteps.length) {
      onComplete(updated);
    } else {
      setCurrentStepIndex(nextIndex);
    }
  };

  const getOptions = (step) => {
    if (!step.options) return null;
    return step.options.map((o) => (typeof o === 'string' ? { label: o } : o));
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleAnswer(inputValue.trim());
  };

  const options = getOptions(currentStep);

  return (
    <AmbientBackground className="min-h-screen">
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            <p className="mb-6 text-center text-sm text-text-secondary">
              Step {currentStepIndex + 1} of {visibleSteps.length}
            </p>

            {/* Conversation history */}
            <div className="mb-8 space-y-3">
              {visibleSteps.slice(0, currentStepIndex).map((step) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex-1">
                    <p className="mb-1 text-xs text-text-secondary">{step.question}</p>
                    <div className="inline-block rounded-xl rounded-tl-sm bg-primary/10 px-3 py-2 text-sm text-primary">
                      {answers[step.id]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current question */}
            <div className="glass-card rounded-[28px] p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{currentStep.question}</p>
                  {currentStep.subtext && (
                    <p className="mt-1 text-sm text-text-secondary">{currentStep.subtext}</p>
                  )}
                  {currentStep.helpTip && (
                    <button
                      type="button"
                      onClick={() => setShowHelp(!showHelp)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-primary/70 transition-colors hover:text-primary"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {showHelp ? 'Got it' : 'What does this mean?'}
                    </button>
                  )}
                  {showHelp && currentStep.helpTip && (
                    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs leading-relaxed text-primary/80">
                      {currentStep.helpTip}
                    </div>
                  )}
                </div>
              </div>

              {options ? (
                <div className="grid gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleAnswer(opt.label)}
                      className="surface-panel rounded-xl px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span className="text-sm text-text-primary">{opt.label}</span>
                      {opt.hint && (
                        <span className="mt-0.5 block text-xs text-text-secondary">{opt.hint}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={currentStep.placeholder}
                    className="control-input flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50"
                  />
                  <RippleButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!inputValue.trim() && currentStep.id !== 'businessName'}
                  >
                    Next
                  </RippleButton>
                </form>
              )}

              {!currentStep.options && (currentStep.id === 'businessName' || currentStep.id === 'helpDetails') && (
                <button
                  type="button"
                  onClick={() => handleAnswer('')}
                  className="mt-2 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  Skip for now
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                {error} — please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </AmbientBackground>
  );
}
