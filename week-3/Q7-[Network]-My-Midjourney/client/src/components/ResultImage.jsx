export default function ResultImage({ loading, error, result }) {
  if (loading) {
    return (
      <div className="brick-card result-card result-state">
        <div className="spinner" aria-hidden="true" />
        <p>이미지 생성 중... (최대 1분 정도 걸릴 수 있어요)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="brick-card result-card result-state error-card">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="brick-card result-card result-state placeholder-card">
        <p>프롬프트를 입력하고 "생성하기"를 눌러보세요.</p>
      </div>
    );
  }

  return (
    <div className="brick-card result-card">
      <img src={result.imageUrl} alt={result.finalPrompt} className="result-image" />
      <p className="final-prompt">
        <strong>최종 프롬프트:</strong> {result.finalPrompt}
      </p>
      <a
        href={result.imageUrl}
        download={`my-midjourney-${Date.now()}.png`}
        className="brick-button download-button"
      >
        이미지 다운로드
      </a>
    </div>
  );
}
