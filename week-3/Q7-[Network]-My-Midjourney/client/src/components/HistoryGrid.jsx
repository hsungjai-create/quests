export default function HistoryGrid({ history, onSelect }) {
  if (history.length === 0) return null;

  return (
    <section className="history-section">
      <h2 className="history-title">생성 히스토리</h2>
      <div className="history-grid">
        {history.map((item) => (
          <button
            key={item.id}
            className="history-thumb"
            onClick={() => onSelect(item)}
            title={item.finalPrompt}
          >
            <img src={item.imageUrl} alt={item.finalPrompt} />
          </button>
        ))}
      </div>
    </section>
  );
}
