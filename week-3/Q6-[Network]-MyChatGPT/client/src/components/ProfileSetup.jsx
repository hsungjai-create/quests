import { useState } from 'react';

export default function ProfileSetup({ profile, onApply }) {
  const [form, setForm] = useState(profile);
  const [applied, setApplied] = useState(true);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setApplied(false);
    };
  }

  function handleApply() {
    onApply(form);
    setApplied(true);
  }

  return (
    <div className="profile-setup">
      <h2>AI 프로필 설정</h2>

      <label className="field">
        <span>이름 / 닉네임</span>
        <input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="예: lume"
        />
      </label>

      <label className="field">
        <span>성격</span>
        <textarea
          value={form.personality}
          onChange={handleChange('personality')}
          placeholder="예: 근거 없는 주장을 믿지 않는 냉철한 성격"
          rows={3}
        />
      </label>

      <label className="field">
        <span>말투</span>
        <textarea
          value={form.tone}
          onChange={handleChange('tone')}
          placeholder="예: 짧고 건조하게"
          rows={2}
        />
      </label>

      <label className="field">
        <span>전문분야</span>
        <input
          type="text"
          value={form.expertise}
          onChange={handleChange('expertise')}
          placeholder="예: 선임 조사관"
        />
      </label>

      <button className="apply-btn" onClick={handleApply} disabled={applied}>
        {applied ? '적용됨' : '적용'}
      </button>

      <p className="hint">
        적용 버튼을 누르면 다음 대화부터 새 프로필이 시스템 프롬프트에 반영됩니다.
      </p>
    </div>
  );
}
