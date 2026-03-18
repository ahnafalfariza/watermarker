function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BatchPanel({ files, activeIndex, onSelect, progress }) {
  return (
    <div className="batch-panel">
      <label className="control-label">
        Files
        <span className="control-value">{files.length}</span>
      </label>

      {progress && (
        <div className="batch-progress">
          <div
            className="batch-progress-bar"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            role="progressbar"
            aria-valuenow={progress.completed}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          />
        </div>
      )}

      <div className="batch-list">
        {files.map((file, i) => (
          <button
            key={`${file.name}-${i}`}
            className={`batch-item ${i === activeIndex ? 'batch-item-active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="batch-item-name">{file.name}</span>
            <span className="batch-item-size">{formatSize(file.size)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
