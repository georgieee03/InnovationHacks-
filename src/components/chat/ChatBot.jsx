import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const QUICK_QUESTIONS = [
  'What insurance do I need?',
  'Explain my coverage gaps',
  'How much should I save?',
  "What's my biggest risk?",
];

function formatCurrencyLocal(value) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-strong-${index}`} className="font-normal text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
  });
}

function MessageBody({ text }) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\u2022/g, '-')
    .replace(/\u2013|\u2014/g, '-');

  const blocks = normalized.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));

        if (isList) {
          return (
            <ul key={`list-${blockIndex}`} className="list-disc space-y-2 pl-5 text-sm leading-7">
              {lines.map((line, lineIndex) => (
                <li key={`item-${blockIndex}-${lineIndex}`}>{renderInline(line.replace(/^[-*]\s+/, ''), `list-${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}`} className="text-sm leading-7 text-inherit">
            {lines.map((line, lineIndex) => (
              <Fragment key={`line-${blockIndex}-${lineIndex}`}>
                {renderInline(line, `paragraph-${blockIndex}-${lineIndex}`)}
                {lineIndex < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function getGapItems(gapAnalysis) {
  return Array.isArray(gapAnalysis) ? gapAnalysis : [];
}

function getSmartFallback(question, context) {
  const q = question.toLowerCase();
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = context;
  const name = businessInfo?.name || 'your business';
  const gaps = getGapItems(gapAnalysis);
  const locationRisks = Object.values(riskFactors?.risks || {});

  if (q.includes('insurance') || q.includes('need') || q.includes('coverage type')) {
    const topNeeds = gaps
      .filter((item) => item.status === 'gap' || item.status === 'underinsured')
      .slice(0, 4)
      .map((item) => `- ${item.name}: ${item.statusLabel}`);

    if (topNeeds.length > 0) {
      return `For ${name}, the first policies to focus on are:\n\n${topNeeds.join('\n')}\n\nStart with the critical gaps first, then fill in recommended protection after that.`;
    }

    return `For ${name}, start with the basics:\n\n- General liability for customer and third-party claims\n- Property coverage for equipment, inventory, and buildout\n- Workers compensation if you have employees\n- Business interruption for forced closures\n\nThe exact mix depends on your industry, location, and current policy details.`;
  }

  if (q.includes('gap') || q.includes('missing') || q.includes('underinsured')) {
    const importantGaps = gaps
      .filter((item) => item.status === 'gap' || item.status === 'underinsured')
      .slice(0, 3)
      .map((item) => `- ${item.name}: ${item.statusLabel}`);

    if (importantGaps.length > 0) {
      return `Here are the biggest coverage issues showing up right now:\n\n${importantGaps.join('\n')}\n\nI would address the critical items before the recommended ones.`;
    }

    return 'I do not have enough policy detail yet to point to exact gaps. Run the Insurance Analyzer so I can compare your current coverage against the recommended stack.';
  }

  if (q.includes('save') || q.includes('emergency') || q.includes('fund') || q.includes('money')) {
    const monthlyExpenses = financialMetrics?.averageMonthlyExpenses || 0;
    const target3 = monthlyExpenses ? formatCurrencyLocal(monthlyExpenses * 3) : null;
    const target6 = monthlyExpenses ? formatCurrencyLocal(monthlyExpenses * 6) : null;

    if (target3 && target6) {
      return `Based on your current numbers, a practical reserve target is ${target3} to ${target6}.\n\n- The low end covers a shorter disruption\n- The high end gives you more room for recovery and payroll pressure\n- Build it by setting a fixed monthly transfer and treating it like a bill`;
    }

    return 'A solid starting point is 3 to 6 months of operating expenses. The riskier your location and the longer your recovery window, the closer you should aim to the high end.';
  }

  if (q.includes('risk') || q.includes('danger') || q.includes('threat') || q.includes('biggest')) {
    if (locationRisks.length > 0) {
      return `Your main location risks right now are:\n\n${locationRisks.slice(0, 3).map((risk) => `- ${risk.label}`).join('\n')}\n\nThose should shape both your insurance priorities and your reserve target.`;
    }

    return 'Your biggest risks usually come from three areas: property damage, liability claims, and downtime that burns cash while revenue stops.';
  }

  return `I can help with insurance, coverage gaps, reserve planning, and scenario analysis for ${name}. Ask about what is missing, what to prioritize next, or how much cash buffer you need.`;
}


function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-text-secondary animate-pulse-subtle" />
      <span className="h-2 w-2 rounded-full bg-text-secondary animate-pulse-subtle" style={{ animationDelay: '120ms' }} />
      <span className="h-2 w-2 rounded-full bg-text-secondary animate-pulse-subtle" style={{ animationDelay: '240ms' }} />
    </div>
  );
}

export default function ChatBot() {
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = useContext(AppContext);
  const nextMessageId = useRef(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 'msg-0',
      role: 'bot',
      text: "Hi. I'm your SafeGuard assistant. I can explain coverage gaps, reserves, and risk scenarios using your business data.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function createMessageId() {
    const id = `msg-${nextMessageId.current}`;
    nextMessageId.current += 1;
    return id;
  }


  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      text: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const response = getSmartFallback(trimmed, { businessInfo, financialMetrics, gapAnalysis, riskFactors });

    await new Promise((resolve) => setTimeout(resolve, 250));

    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: 'bot',
        text: response,
      },
    ]);
    setIsTyping(false);
    inputRef.current?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-4xl flex-col gap-4">
      <section className="glass-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-heading font-light tracking-[-0.02em] text-text-primary">SafeGuard AI Assistant</h2>
            <p className="mt-1 text-sm font-light text-text-secondary">
              Ask about missing coverage, reserve planning, or how a specific event would hit your business.
            </p>
            {businessInfo && (
              <p className="mt-2 text-xs font-normal uppercase tracking-[0.05em] text-text-secondary">
                Context loaded for {businessInfo.name}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[88%] items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user' ? 'bg-primary text-white shadow-[0_10px_22px_rgba(0,207,49,0.24)]' : 'surface-panel text-text-secondary'
                }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${
                  message.role === 'user'
                    ? 'border-primary/30 bg-primary/15 text-text-primary shadow-[0_14px_30px_rgba(0,207,49,0.14)]'
                    : 'surface-panel text-text-secondary'
                }`}>
                  <MessageBody text={message.text} />
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="surface-panel rounded-2xl">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 px-4 py-3 md:px-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                disabled={isTyping}
                className="surface-chip focus-ring-brand rounded-full px-3 py-1.5 text-xs font-normal text-text-secondary transition-all duration-200 hover:border-primary/30 hover:text-text-primary disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about insurance, reserves, or scenario impact..."
              aria-label="Ask SafeGuard assistant a question"
              disabled={isTyping}
              className="control-input focus-ring-brand flex-1 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isTyping}
              className="focus-ring-brand inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-white shadow-[0_16px_30px_rgba(0,207,49,0.2)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_18px_34px_rgba(0,207,49,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
