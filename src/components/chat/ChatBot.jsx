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
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-strong-${index}`} className="font-normal text-text-primary">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
  });
}

function MessageBody({ text }) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\u2022/g, '-').replace(/\u2013|\u2014/g, '-');
  const blocks = normalized.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={`list-${blockIndex}`} className="list-disc space-y-1 pl-4 text-xs leading-5">
              {lines.map((line, li) => <li key={`item-${blockIndex}-${li}`}>{renderInline(line.replace(/^[-*]\s+/, ''), `list-${blockIndex}-${li}`)}</li>)}
            </ul>
          );
        }
        return (
          <p key={`p-${blockIndex}`} className="text-xs leading-5 text-inherit">
            {lines.map((line, li) => (
              <Fragment key={`line-${blockIndex}-${li}`}>
                {renderInline(line, `p-${blockIndex}-${li}`)}
                {li < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function getSmartFallback(question, context) {
  const q = question.toLowerCase();
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = context;
  const name = businessInfo?.name || 'your business';
  const gaps = Array.isArray(gapAnalysis) ? gapAnalysis : [];
  const locationRisks = Object.values(riskFactors?.risks || {});

  if (q.includes('insurance') || q.includes('need') || q.includes('coverage type')) {
    const topNeeds = gaps.filter((i) => i.status === 'gap' || i.status === 'underinsured').slice(0, 4).map((i) => `- ${i.name}: ${i.statusLabel}`);
    if (topNeeds.length > 0) return `For ${name}, focus on:\n\n${topNeeds.join('\n')}\n\nStart with critical gaps first.`;
    return `For ${name}, start with general liability, property coverage, workers comp, and business interruption.`;
  }
  if (q.includes('gap') || q.includes('missing') || q.includes('underinsured')) {
    const importantGaps = gaps.filter((i) => i.status === 'gap' || i.status === 'underinsured').slice(0, 3).map((i) => `- ${i.name}: ${i.statusLabel}`);
    if (importantGaps.length > 0) return `Biggest coverage issues:\n\n${importantGaps.join('\n')}\n\nAddress critical items first.`;
    return 'Run the Insurance Analyzer to identify exact gaps.';
  }
  if (q.includes('save') || q.includes('emergency') || q.includes('fund') || q.includes('money')) {
    const me = financialMetrics?.averageMonthlyExpenses || 0;
    if (me) return `Reserve target: ${formatCurrencyLocal(me * 3)} to ${formatCurrencyLocal(me * 6)}.\n\nBuild it by setting a fixed monthly transfer.`;
    return '3 to 6 months of operating expenses is a solid starting point.';
  }
  if (q.includes('risk') || q.includes('danger') || q.includes('threat') || q.includes('biggest')) {
    if (locationRisks.length > 0) return `Top location risks:\n\n${locationRisks.slice(0, 3).map((r) => `- ${r.label}`).join('\n')}`;
    return 'Biggest risks usually come from property damage, liability claims, and downtime.';
  }
  return `I can help with insurance, coverage gaps, reserve planning, and scenario analysis for ${name}.`;
}

async function callClaudeAPI(messages, systemPrompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: systemPrompt, messages: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse-subtle" />
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse-subtle" style={{ animationDelay: '120ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse-subtle" style={{ animationDelay: '240ms' }} />
    </div>
  );
}

export default function ChatBot() {
  const { businessInfo, financialMetrics, gapAnalysis, riskFactors } = useContext(AppContext);
  const nextId = useRef(1);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([{ id: 'msg-0', role: 'bot', text: "Hi. I'm your SafeGuard assistant. Ask about coverage, reserves, or risk scenarios." }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  function createId() { const id = `msg-${nextId.current}`; nextId.current += 1; return id; }

  function buildSystemPrompt() {
    let p = 'You are SafeGuard AI, a concise business insurance advisor. Keep answers short and practical.';
    if (businessInfo) p += `\nBusiness: ${businessInfo.name}, type ${businessInfo.type}, ${businessInfo.city} ${businessInfo.state}, employees ${businessInfo.employees}.`;
    if (riskFactors) p += `\nRisks: ${JSON.stringify(riskFactors)}.`;
    if (gapAnalysis) p += `\nGaps: ${JSON.stringify(gapAnalysis)}.`;
    return p;
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { id: createId(), role: 'user', text: trimmed };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    let response = await callClaudeAPI(newMsgs.slice(1), buildSystemPrompt());
    if (!response) response = getSmartFallback(trimmed, { businessInfo, financialMetrics, gapAnalysis, riskFactors });
    await new Promise((r) => setTimeout(r, 250));
    setMessages((cur) => [...cur, { id: createId(), role: 'bot', text: response }]);
    setIsTyping(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-normal text-text-primary">SafeGuard AI</p>
          <p className="text-[11px] font-light text-text-secondary">Insurance & risk advisor</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white/10 text-text-secondary'}`}>
                {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
              </div>
              <div className={`rounded-xl border px-3 py-2 ${msg.role === 'user' ? 'border-primary/30 bg-primary/15 text-text-primary' : 'border-white/10 bg-bg-secondary/70 text-text-secondary'}`}>
                <MessageBody text={msg.text} />
              </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="flex justify-start"><div className="rounded-xl border border-white/10 bg-bg-secondary/70"><TypingIndicator /></div></div>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} disabled={isTyping}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-normal text-text-secondary transition hover:border-primary/30 hover:text-text-primary disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..."
            disabled={isTyping} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:border-primary focus:outline-none disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isTyping}
            className="rounded-lg bg-primary px-3 py-2 text-white transition hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
