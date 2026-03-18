import { useEffect, useRef, useState, useCallback } from 'react'
import { generatePreview } from '../../lib/imageProcessor.js'
import { renderPdfPage } from '../../lib/pdfProcessor.js'

export default function Preview({ file, watermark }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfPageCount, setPdfPageCount] = useState(1)
  const debounceRef = useRef(null)

  const isPdf = file?.type === 'application/pdf'

  const renderPreview = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      let resultCanvas
      if (isPdf) {
        const result = await renderPdfPage(file, pdfPage, watermark, 800)
        resultCanvas = result.canvas
        setPdfPageCount(result.numPages)
      } else {
        resultCanvas = await generatePreview(file, watermark, 800)
      }

      const target = canvasRef.current
      if (target) {
        target.width = resultCanvas.width
        target.height = resultCanvas.height
        const ctx = target.getContext('2d')
        ctx.drawImage(resultCanvas, 0, 0)
      }
    } catch (err) {
      setError(err.message || 'Preview unavailable for this file.')
    } finally {
      setLoading(false)
    }
  }, [file, watermark, isPdf, pdfPage])

  useEffect(() => {
    // Reset PDF page when file changes
    setPdfPage(1)
  }, [file])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(renderPreview, 150)
    return () => clearTimeout(debounceRef.current)
  }, [renderPreview])

  return (
    <div className="preview">
      {loading && (
        <div className="preview-loading">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="preview-error">
          <p>{error}</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="preview-canvas"
        style={{ display: error ? 'none' : 'block' }}
        aria-label={`Preview of ${file?.name || 'file'} with watermark`}
      />

      {isPdf && !error && (
        <div className="pdf-nav">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPdfPage(p => Math.max(1, p - 1))}
            disabled={pdfPage <= 1}
          >
            &larr;
          </button>
          <span className="pdf-nav-label">
            Page {pdfPage} of {pdfPageCount}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPdfPage(p => Math.min(pdfPageCount, p + 1))}
            disabled={pdfPage >= pdfPageCount}
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
