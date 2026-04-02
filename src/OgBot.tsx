import { useState, useCallback, useEffect, useRef } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type AiMessage = {
  id: string;
  question: string;
  answer: string;
  streaming: boolean;
  error?: string;
};

export default function OgBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        question: '',
        answer: 'Hey 👋 I\'m your film-finance OG!\n\nI can see you\'re building your model — ask me anything about deals, waterfalls, packaging, or how to get your film financed.',
        streaming: false,
      }]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = useCallback(async (question: string) => {
    const q = question.trim().slice(0, 1500);
    if (!q || loading) return;
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, question: q, answer: '', streaming: true }]);
    setLoading(true);
    setInput('');
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ask-the-og`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.id !== 'greeting').map(m => [
              { role: 'user', content: m.question },
              ...(m.answer ? [{ role: 'assistant', content: m.answer }] : []),
            ]).flat(),
            { role: 'user', content: q },
          ],
        }),
      });
      if (!resp.ok || !resp.body) throw new Error('Failed');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).replace(/\r$/, '');
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) setMessages(prev => prev.map(m => m.id === id ? { ...m, answer: m.answer + content } : m));
          } catch { /* skip */ }
        }
      }
      setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false, error: 'Something went wrong. Try again.' } : m));
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  // Desktop: right-side panel (480px wide, full height)
  // Mobile: bottom sheet (full width, full height)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const panelStyle: React.CSSProperties = isDesktop ? {
    position: 'fixed',
    top: 0,
    right: isOpen ? 0 : -520,
    width: 480,
    height: '100vh',
    transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
    zIndex: 180,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(18,18,20,0.97)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderLeft: '1px solid rgba(212,175,55,0.20)',
    boxShadow: '-20px 0 60px rgba(0,0,0,0.60)',
  } : {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '92dvh',
    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
    zIndex: 180,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(18,18,20,0.97)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderTop: '1px solid rgba(212,175,55,0.20)',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -20px 60px rgba(0,0,0,0.60)',
  };

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && !isDesktop && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 170 }}
        />
      )}

      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #F9E076)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.20)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontSize: 22,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(212,175,55,0.60), 0 0 0 1px rgba(212,175,55,0.30)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,175,55,0.45), 0 0 0 1px rgba(212,175,55,0.20)'; }}
          aria-label="Ask the OG"
        >
          ✦
        </button>
      )}

      {/* Chat panel */}
      <div style={panelStyle}>
        {/* Gold top line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.60), transparent)' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✦</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.12em', color: '#D4AF37', lineHeight: 1 }}>ASK THE OG</div>
              <div style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.08em', marginTop: 2 }}>FILM FINANCE AI</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setMessages([]); }} style={{ background: 'none', border: 'none', color: 'rgba(212,175,55,0.50)', cursor: 'pointer', fontSize: 11, fontFamily: "'Roboto Mono', monospace", letterSpacing: '0.1em' }}>RESET</button>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 24 }}>
              {msg.question && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <div style={{ maxWidth: '85%', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.20)', borderRadius: 8, padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5 }}>
                    {msg.question}
                  </div>
                </div>
              )}
              <div style={{ background: 'rgba(10,10,10,0.80)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 8, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)' }} />
                {msg.streaming && !msg.answer ? (
                  <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,175,55,0.50)', animation: 'pulse 1.2s infinite', animationDelay: `${i*0.2}s` }} />)}
                  </div>
                ) : (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {msg.error ? <span style={{ color: 'rgba(255,255,255,0.50)' }}>{msg.error}</span> : msg.answer}
                    {msg.streaming && <span style={{ color: 'rgba(212,175,55,0.60)' }}>▊</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested chips after last message */}
        {messages.length > 0 && !loading && (
          <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['What is my erosion rate?', 'Is my deal healthy?', 'How do tax credits work?'].map(chip => (
              <button key={chip} onClick={() => handleAsk(chip)} style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, padding: '6px 12px', fontFamily: "'Roboto Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', letterSpacing: '0.04em' }}>{chip}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(212,175,55,0.15)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, overflow: 'hidden' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 1500))}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(input); } }}
              placeholder="Ask about deals, waterfalls, or your model…"
              rows={2}
              disabled={loading}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 16px', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: 15, resize: 'none', minHeight: 52 }}
            />
            <button
              onClick={() => handleAsk(input)}
              disabled={!input.trim() || loading}
              style={{ background: '#F9E076', color: '#000', border: 'none', padding: '0 20px', fontFamily: "'Roboto Mono', monospace", fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
