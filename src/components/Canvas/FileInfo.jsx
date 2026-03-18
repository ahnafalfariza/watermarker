function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileInfo({ file }) {
  if (!file) return null

  return (
    <div className="file-info">
      <span className="file-info-name">{file.name}</span>
      <span className="file-info-size">{formatSize(file.size)}</span>
    </div>
  )
}
