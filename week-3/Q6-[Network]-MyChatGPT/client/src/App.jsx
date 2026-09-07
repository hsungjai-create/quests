import { useState } from 'react';
import ProfileSetup from './components/ProfileSetup.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import './App.css';

const DEFAULT_PROFILE = {
  name: 'lume',
  personality: '근거 없는 주장을 믿지 않는 냉철한 성격',
  tone: '짧고 건조하게',
  expertise: '선임 조사관',
};

export default function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(text) {
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, messages: nextMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || '알 수 없는 오류가 발생했습니다.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <ProfileSetup profile={profile} onApply={setProfile} />
      </aside>
      <main className="main">
        <header className="profile-bar">
          <span className="badge badge-name">{profile.name}</span>
          <span className="badge badge-expertise">{profile.expertise}</span>
        </header>
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          onSend={sendMessage}
        />
      </main>
    </div>
  );
}
