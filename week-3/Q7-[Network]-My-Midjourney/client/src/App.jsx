import { useState } from 'react';
import { LEGO_STYLE } from './constants/styles.js';
import PromptForm from './components/PromptForm.jsx';
import ResultImage from './components/ResultImage.jsx';
import HistoryGrid from './components/HistoryGrid.jsx';
import ApiKeySettings, { loadApiKey } from './components/ApiKeySettings.jsx';
import './App.css';

export default function App() {
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  async function handleGenerate(prompt) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-Google-Api-Key': apiKey } : {}),
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || '알 수 없는 오류가 발생했습니다.');
      }

      const entry = {
        id: `${Date.now()}`,
        imageUrl: data.imageUrl,
        finalPrompt: data.finalPrompt,
      };

      setResult(entry);
      setHistory((prev) => [entry, ...prev]);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
          : err.message || '요청 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🧱 My-Midjourney (나만의 미드저니)</h1>
        <p className="app-subtitle">레고 브릭 스타일</p>
        <div className="brick-card style-card">
          <p className="style-name">{LEGO_STYLE.name}</p>
          <p className="style-description">{LEGO_STYLE.description}</p>
        </div>
      </header>

      <main className="app-main">
        <ApiKeySettings apiKey={apiKey} onChange={setApiKey} />
        <PromptForm loading={loading} onSubmit={handleGenerate} />
        <ResultImage loading={loading} error={error} result={result} />
        <HistoryGrid history={history} onSelect={setResult} />
      </main>
    </div>
  );
}
