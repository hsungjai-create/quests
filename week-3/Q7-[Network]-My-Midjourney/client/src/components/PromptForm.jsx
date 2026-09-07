import { useState } from 'react';

export default function PromptForm({ loading, onSubmit }) {
  const [prompt, setPrompt] = useState('');
  const [warning, setWarning] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!prompt.trim()) {
      setWarning('프롬프트를 입력해주세요.');
      return;
    }

    setWarning('');
    onSubmit(prompt.trim());
  }

  return (
    <form className="brick-card prompt-form" onSubmit={handleSubmit}>
      <label htmlFor="prompt" className="prompt-label">
        어떤 장면을 레고 브릭으로 만들어볼까요?
      </label>
      <div className="prompt-row">
        <input
          id="prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 우주비행사가 달에서 커피를 마시는 모습"
          disabled={loading}
          className="prompt-input"
        />
        <button type="submit" className="brick-button" disabled={loading}>
          {loading ? '생성 중...' : '생성하기'}
        </button>
      </div>
      {warning && <p className="warning-text">{warning}</p>}
    </form>
  );
}
