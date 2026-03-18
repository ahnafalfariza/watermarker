import { useState, useCallback, useRef } from 'react'
import ThemeToggle from './ThemeToggle.jsx'

export default function DropZone({ onFiles }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files)
    }
  }, [onFiles])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback((e) => {
    if (e.target.files.length > 0) {
      onFiles(e.target.files)
    }
  }, [onFiles])

  return (
    <div className="dropzone-page">
      <header className="header">
        <h1 className="header-title">Watermark</h1>
        <ThemeToggle />
      </header>

      <main className="dropzone-content">
        <div
          className={`dropzone ${dragOver ? 'dropzone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          aria-label="Drop files here to watermark or click to browse"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dropzone-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <p className="dropzone-text">Drop files here to watermark</p>
          <p className="dropzone-subtext">or click to browse</p>

          <div className="dropzone-formats">
            <span className="format-badge">JPG</span>
            <span className="format-sep">&middot;</span>
            <span className="format-badge">PNG</span>
            <span className="format-sep">&middot;</span>
            <span className="format-badge">WebP</span>
            <span className="format-sep">&middot;</span>
            <span className="format-badge">PDF</span>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="privacy-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Files never leave your device</span>
        </div>
      </main>
    </div>
  )
}
