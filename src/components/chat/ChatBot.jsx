import { useContext, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const QUICK_QUESTIONS = [
  'What insurance do I need?',
  'Explain my coverage gaps',
  'How much should I save?',
  "What's my biggest risk?",
];

function getGapItems(gapAnalysis) {
  if (Array.isArray(gapAnalysis)) {
    return gapAnalysis;
  }

  return gapAnalysis?.gaps ?? [];
}

function getSmartFallback(question, context) {
  const q = question.toLowerCase();
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = context;
  const name = businessInfo?.name || 'your business';
  const gaps = getGapItems(gapAnalysis);

  if (q.includes('insurance') || q.includes('need') || q.includes('coverage type')) {
    return `Great question! For ${name}, I'd recommend looking into these key coverage types:\n\n`
      + `- General Liability protects against third-party bodily injury or property damage claims.\n`
      + `- Property Insurance covers physical assets like equipment and inventory.\n`
      + `- Workers' Compensation is often required if you have employees.\n`
      + `- Business Interruption replaces lost income after a covered shutdown.\n\n`
      + `The right mix depends on your industry, location, and size. Check the Insurance Analyzer tab for a personalized breakdown.`;
  }

  if (q.includes('gap') || q.includes('missing') || q.includes('underinsured')) {
    if (gaps.length > 0) {
      const gapList = gaps
        .filter((gap) => gap.status === 'gap' || gap.status === 'underinsured')
        .slice(0, 3)
        .map((gap) => `- ${gap.name || gap.id}: ${gap.statusLabel || 'Needs attention'}`)
        .join('\n');
      return `Based on your gap analysis, here are the areas that need attention:\n\n${gapList}\n\nI'd prioritize these items first. Visit the Insurance Analyzer for the full breakdown.`;
    }

    return `To identify your coverage gaps, upload a policy in the Insurance Analyzer tab. I'll compare it against your business risk profile and highlight where you're exposed.`;
  }

  if (q.includes('save') || q.includes('emergency') || q.includes('fund') || q.includes('money')) {
    const monthlyExpenses = financialMetrics?.monthlyExpenses || financialMetrics?.averageMonthlyExpenses;
    if (monthlyExpenses) {
      const target3 = (monthlyExpenses * 3).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const target6 = (monthlyExpenses * 6).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      return `Based on your financials, I'd recommend an emergency fund of ${target3} to ${target6} (3-6 months of expenses).\n\nStart by setting aside a fixed percentage of monthly revenue. Even 5-10% adds up quickly.`;
    }

    return `The standard recommendation is to save 3-6 months of operating expenses as an emergency fund. Start small - even 5% of monthly revenue builds a meaningful cushion over time.`;
  }

  if (q.includes('risk') || q.includes('danger') || q.includes('threat') || q.includes('biggest')) {
    const topRisks = Object.values(riskFactors?.risks ?? {})
      .filter((risk) => risk.level && risk.level !== 'low')
      .map((risk) => `${risk.label} (${risk.level})`);

    if (topRisks.length > 0) {
      return `Based on your location, here are your top risk factors:\n\n${topRisks.map((risk) => `- ${risk}`).join('\n')}\n\nThese should inform your insurance priorities. The Risk Simulator tab lets you model how these scenarios could impact your finances.`;
    }

    return `Your biggest risks usually depend on your location, industry, and size. Common threats include natural disasters, liability claims, equipment breakdown, theft, and business interruption.`;
  }

  return `I can help with insurance, risk management, and financial resilience planning for ${name}. Start with the Insurance Analyzer for coverage gaps, then use the Action Plan and Risk Simulator to prioritize next steps.`;
}

async function callClaudeAPI(messages, systemPrompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((message) => ({
          role: message.role === 'user' ? 'user' : 'assistant',
          content: message.text,
        })),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="h-2 w-2 rounded-full bg-text-secondary"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function ChatBot() {
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = useContext(AppContext);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hi! I'm your SafeGuard AI assistant. I can help you understand insurance, identify risks, and plan for your business's financial resilience. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const idRef = useRef(1);

  const nextId = useMemo(() => () => {
    const value = idRef.current;
    idRef.current += 1;
    return `msg-${value}`;
  }, []);

  const buildSystemPrompt = () => {
    let prompt = 'You are SafeGuard AI, a business insurance advisor. Keep responses concise, practical, and grounded in the provided business context. Use short markdown lists when useful.';
    if (businessInfo) prompt += `\n\nBusiness context: ${businessInfo.name}, type: ${businessInfo.type}, location: ${businessInfo.city}, ${businessInfo.state} (${businessInfo.zip}), employees: ${businessInfo.employees}, monthly revenue: $${businessInfo.monthlyRevenue}.`;
    if (riskFactors) prompt += `\nRisk factors: ${JSON.stringify(riskFactors)}`;
    if (gapAnalysis) prompt += `\nGap analysis: ${JSON.stringify(gapAnalysis)}`;
    return prompt;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: nextId(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    let response = await callClaudeAPI(
      newMessages.filter((message) => message.id !== 'welcome'),
      buildSystemPrompt(),
    );

    if (!response) {
      response = getSmartFallback(text, { businessInfo, financialMetrics, gapAnalysis, riskFactors });
    }

    await new Promise((resolve) => setTimeout(resolve, response ? 400 : 800));

    setMessages((prev) => [...prev, { id: nextId(), role: 'bot', text: response }]);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-text-primary">SafeGuard AI Assistant</h2>
          <p className="text-sm text-text-secondary">Ask me anything about insurance and risk management</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-2 pr-2">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-primary text-white' : 'border border-gray-200/60 bg-white/80 text-text-primary shadow-sm backdrop-blur-sm'}`}>
                  {message.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-wrap gap-2 py-3">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => void sendMessage(question)}
            disabled={isTyping}
            className="rounded-full border border-primary/30 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/5 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about insurance, risks, or financial planning..."
          disabled={isTyping}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="rounded-xl bg-primary px-4 py-3 text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
