import { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const QUICK_QUESTIONS = [
  'What insurance do I need?',
  'Explain my coverage gaps',
  'How much should I save?',
  "What's my biggest risk?",
];

function getSmartFallback(question, context) {
  const q = question.toLowerCase();
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = context;
  const name = businessInfo?.name || 'your business';

  if (q.includes('insurance') || q.includes('need') || q.includes('coverage type')) {
    return `Great question! For ${name}, I'd recommend looking into these key coverage types:\n\n` +
      `• **General Liability** — protects against third-party claims for bodily injury or property damage.\n` +
      `• **Property Insurance** — covers your physical assets like equipment and inventory.\n` +
      `• **Workers' Compensation** — required in most states if you have employees.\n` +
      `• **Business Interruption** — replaces lost income if a covered event forces you to close temporarily.\n\n` +
      `The right mix depends on your industry, location, and size. Check the Insurance Analyzer tab for a personalized breakdown.`;
  }

  if (q.includes('gap') || q.includes('missing') || q.includes('underinsured')) {
    if (gapAnalysis && gapAnalysis.gaps && gapAnalysis.gaps.length > 0) {
      const gapList = gapAnalysis.gaps.slice(0, 3).map(g => `• ${g.type}: ${g.recommendation || 'Consider adding this coverage'}`).join('\n');
      return `Based on your gap analysis, here are the areas that need attention:\n\n${gapList}\n\n` +
        `I'd prioritize addressing these gaps to strengthen your coverage. Visit the Insurance Analyzer for full details.`;
    }
    return `To identify your coverage gaps, I'd need to analyze your current policies against your risk profile. ` +
      `Head over to the Insurance Analyzer tab and upload your policy documents — I'll highlight exactly where you're exposed.`;
  }

  if (q.includes('save') || q.includes('emergency') || q.includes('fund') || q.includes('money')) {
    const monthlyExpenses = financialMetrics?.monthlyExpenses || financialMetrics?.averageMonthlyExpenses;
    if (monthlyExpenses) {
      const target3 = (monthlyExpenses * 3).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const target6 = (monthlyExpenses * 6).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      return `Based on your financials, I'd recommend an emergency fund of **${target3} to ${target6}** (3-6 months of expenses).\n\n` +
        `Start by setting aside a fixed percentage of monthly revenue. Even 5-10% adds up quickly. ` +
        `Check the Financial Overview tab to track your progress toward this goal.`;
    }
    return `The standard recommendation is to save 3-6 months of operating expenses as an emergency fund. ` +
      `This gives you a buffer for unexpected events like equipment failure, natural disasters, or slow seasons.\n\n` +
      `Start small — even setting aside 5% of monthly revenue builds a meaningful cushion over time.`;
  }

  if (q.includes('risk') || q.includes('danger') || q.includes('threat') || q.includes('biggest')) {
    if (riskFactors) {
      const topRisks = [];
      if (riskFactors.flood_risk && riskFactors.flood_risk !== 'low') topRisks.push(`Flood risk (${riskFactors.flood_risk})`);
      if (riskFactors.hurricane_risk && riskFactors.hurricane_risk !== 'low') topRisks.push(`Hurricane risk (${riskFactors.hurricane_risk})`);
      if (riskFactors.crime_index && riskFactors.crime_index > 50) topRisks.push(`Elevated crime index (${riskFactors.crime_index})`);
      if (topRisks.length > 0) {
        return `Based on your location, here are your top risk factors:\n\n${topRisks.map(r => `• ${r}`).join('\n')}\n\n` +
          `These should inform your insurance priorities. The Risk Simulator tab lets you model how these scenarios could impact your finances.`;
      }
    }
    return `Your biggest risks typically depend on your location, industry, and business size. Common threats include:\n\n` +
      `• Natural disasters (floods, storms, fires)\n• Liability claims from customers or employees\n• Equipment breakdown or theft\n• Business interruption from unexpected events\n\n` +
      `Use the Risk Simulator to model specific scenarios for your situation.`;
  }

  return `That's a great question! While I'm best at answering questions about insurance, risk management, and financial planning for small businesses, ` +
    `I'll do my best to help.\n\nFor ${name}, I'd suggest exploring the different tabs in SafeGuard — ` +
    `the Financial Overview, Insurance Analyzer, and Risk Simulator can give you detailed, personalized insights.`;
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
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
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
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-text-secondary"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
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
      text: `Hi! I'm your SafeGuard AI assistant. I can help you understand insurance, identify risks, and plan for your business's financial resilience. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const buildSystemPrompt = () => {
    let prompt = `You are SafeGuard AI, a friendly and knowledgeable business insurance advisor. You help small business owners understand their insurance needs, coverage gaps, and financial resilience strategies. Keep responses concise, practical, and encouraging. Use markdown formatting for lists and emphasis.`;
    if (businessInfo) prompt += `\n\nBusiness context: ${businessInfo.name}, type: ${businessInfo.type}, location: ${businessInfo.city}, ${businessInfo.state} (${businessInfo.zip}), employees: ${businessInfo.employees}, monthly revenue: $${businessInfo.monthlyRevenue}.`;
    if (riskFactors) prompt += `\nRisk factors: ${JSON.stringify(riskFactors)}`;
    if (gapAnalysis) prompt += `\nGap analysis: ${JSON.stringify(gapAnalysis)}`;
    return prompt;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    let response = await callClaudeAPI(
      newMessages.filter(m => m.id !== 'welcome'),
      buildSystemPrompt()
    );

    if (!response) {
      response = getSmartFallback(text, { businessInfo, financialMetrics, gapAnalysis, riskFactors });
    }

    // Simulate a small delay for the fallback to feel natural
    await new Promise(r => setTimeout(r, response ? 400 : 800));

    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: response }]);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-text-primary">SafeGuard AI Assistant</h2>
          <p className="text-sm text-text-secondary">Ask me anything about insurance & risk management</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200/60 text-text-primary shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2 py-3">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={isTyping}
            className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about insurance, risks, or financial planning..."
          disabled={isTyping}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
