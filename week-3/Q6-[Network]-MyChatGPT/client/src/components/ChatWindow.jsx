import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function ChatWindow({ messages, loading, error, onSend }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.length === 0 && (
          <p className="empty-hint">메시지를 입력해 대화를 시작해보세요.</p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="bubble-row bubble-row-assistant">
            <div className="bubble bubble-assistant bubble-loading">입력 중...</div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        <div ref={scrollRef} />
      </div>

      <form className="input-bar" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          전송
        </button>
      </form>
    </div>
  );
}
