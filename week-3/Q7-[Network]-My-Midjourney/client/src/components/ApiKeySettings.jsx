import { useState } from 'react';

// 키는 이 브라우저의 localStorage에만 저장됩니다.
// 서버 파일이나 Git 저장소에는 절대 쓰이지 않으며, 요청 시 헤더로만 전달되어 즉시 사용되고 버려집니다.
const STORAGE_KEY = 'my-midjourney-google-api-key';

export function loadApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    // 프라이빗 브라우징 등으로 localStorage를 쓸 수 없는 환경은 조용히 무시합니다.
    return '';
  }
}

function persistApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // no-op
  }
}

export default function ApiKeySettings({ apiKey, onChange }) {
  const [draft, setDraft] = useState(apiKey);
  const [visible, setVisible] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    const trimmed = draft.trim();
    persistApiKey(trimmed);
    onChange(trimmed);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  }

  function handleClear() {
    setDraft('');
    persistApiKey('');
    onChange('');
  }

  return (
    <details className="brick-card settings-card">
      <summary className="settings-summary">
        🔑 Google API 키 설정 {apiKey ? '(설정됨)' : '(미설정)'}
      </summary>
      <form onSubmit={handleSave} className="settings-form">
        <p className="settings-hint">
          Google(Gemini/나노 바나나) API 키는 이 브라우저에만 저장되고, 요청할 때마다 서버로
          전달되어 즉시 사용된 뒤 버려집니다. 서버 파일이나 코드, Git 저장소에는 절대 저장되지
          않습니다.
        </p>
        <div className="settings-row">
          <input
            type={visible ? 'text' : 'password'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="AIza..."
            className="prompt-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="brick-button ghost-button"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? '숨기기' : '보기'}
          </button>
        </div>
        <div className="settings-actions">
          <button type="submit" className="brick-button">
            저장
          </button>
          <button type="button" className="brick-button ghost-button" onClick={handleClear}>
            삭제
          </button>
          {savedNotice && <span className="settings-saved">저장했습니다.</span>}
        </div>
      </form>
    </details>
  );
}
