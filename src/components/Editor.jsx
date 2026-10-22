import { useState, useCallback } from 'react'
import Controls from './Sidebar/Controls.jsx'
import PositionGrid from './Sidebar/PositionGrid.jsx'
import TemplatePanel from './Sidebar/TemplatePanel.jsx'
import Preview from './Canvas/Preview.jsx'
import FileInfo from './Canvas/FileInfo.jsx'
import BatchPanel from './BatchPanel.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { processImage } from '../lib/imageProcessor.js'
import { processPdf } from '../lib/pdfProcessor.js'
import { processBatch, createZip } from '../lib/batchCoordinator.js'

function isWatermarkReady(watermark) {
  if (watermark.mode === 'image') return !!watermark.logoElement
  return !!watermark.text?.trim()
}

export default function Editor({
  files,
  activeIndex,
  onActiveIndexChange,
  watermark,
  onWatermarkChange,
  onStartOver,
  addToast,
}) {
  const [downloading, setDownloading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [flattenPdf, setFlattenPdf] = useState(false)

  const activeFile = files[activeIndex]
  const isBatch = files.length > 1
  const isPdf = activeFile?.type === 'application/pdf'
  const hasPdf = files.some(f => f.type === 'application/pdf')
  const canDownload = isWatermarkReady(watermark)

  const handleDownloadSingle = useCallback(async () => {
    if (!isWatermarkReady(watermark)) return
    setDownloading(true)
    try {
      let blob
      if (isPdf) {
        const pdfBytes = await processPdf(activeFile, watermark, { flatten: flattenPdf })
        blob = new Blob([pdfBytes], { type: 'application/pdf' })
      } else {
        blob = await processImage(activeFile, watermark, activeFile.type)
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const baseName = activeFile.name.replace(/\.[^.]+$/, '')
      const ext = isPdf ? '.pdf' : activeFile.name.match(/\.[^.]+$/)?.[0] || '.png'
      a.href = url
      a.download = `${baseName}_watermarked${ext}`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Download complete.', 'success')
    } catch (err) {
      addToast(err.message || 'Processing failed — try a smaller file.', 'error')
    } finally {
      setDownloading(false)
    }
  }, [activeFile, watermark, isPdf, flattenPdf, addToast])

  const handleDownloadZip = useCallback(async () => {
    if (!isWatermarkReady(watermark)) return
    setDownloading(true)
    setBatchProgress({ completed: 0, total: files.length, status: 'processing' })

    try {
      const { results } = await processBatch(files, watermark, (progress) => {
        setBatchProgress(progress)
      }, { flattenPdf })

      const succeeded = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (succeeded.length === 0) {
        addToast('All files failed to process.', 'error')
        return
      }

      const zip = await createZip(results)
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = 'watermarked_files.zip'
      a.click()
      URL.revokeObjectURL(url)

      if (failed.length > 0) {
        addToast(`${succeeded.length} of ${files.length} processed. ${failed.length} failed.`, 'warning')
      } else {
        addToast(`${files.length} files processed.`, 'success')
      }
    } catch (err) {
      addToast(err.message || 'Batch processing failed.', 'error')
    } finally {
      setDownloading(false)
      setBatchProgress(null)
    }
  }, [files, watermark, flattenPdf, addToast])

  const updateWatermark = useCallback((key, value) => {
    onWatermarkChange(prev => ({ ...prev, [key]: value }))
  }, [onWatermarkChange])

  const downloadHint = watermark.mode === 'image'
    ? 'Upload a logo above to download'
    : 'Enter watermark text above to download'

  return (
    <div className="editor">
      <header className="header">
        <nav className="header-nav">
          <h1 className="header-title">Watermark</h1>
          <div className="header-actions">
            <ThemeToggle />
            <button className="btn btn-ghost" onClick={onStartOver}>
              Start Over
            </button>
          </div>
        </nav>
      </header>

      <div className="editor-layout">
        <aside className="sidebar">
          <Controls watermark={watermark} onChange={updateWatermark} addToast={addToast} />
          <PositionGrid watermark={watermark} onChange={updateWatermark} />
          <TemplatePanel watermark={watermark} onLoad={onWatermarkChange} addToast={addToast} />

          {isBatch && (
            <BatchPanel
              files={files}
              activeIndex={activeIndex}
              onSelect={onActiveIndexChange}
              progress={batchProgress}
            />
          )}

          <div className="sidebar-actions">
            {hasPdf && (
              <div className="flatten-option">
                <label className="toggle-label">
                  <span className="toggle-text">Flatten PDF</span>
                  <button
                    className={`toggle ${flattenPdf ? 'toggle-on' : ''}`}
                    onClick={() => setFlattenPdf(v => !v)}
                    role="switch"
                    aria-checked={flattenPdf}
                    aria-label="Flatten PDF"
                    aria-describedby="flatten-hint"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </label>
                <p id="flatten-hint" className="flatten-hint">
                  {flattenPdf
                    ? 'Watermark is burned in and can\'t be removed. Larger file, text not selectable.'
                    : 'Watermark is a separate layer. Small file, text stays selectable.'}
                </p>
              </div>
            )}
            {isBatch ? (
              <button
                className="btn btn-primary btn-full"
                onClick={handleDownloadZip}
                disabled={!canDownload || downloading}
              >
                {downloading ? 'Processing files...' : `Download ZIP (${files.length} files)`}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-full"
                onClick={handleDownloadSingle}
                disabled={!canDownload || downloading}
              >
                {downloading ? 'Processing...' : 'Download'}
              </button>
            )}
            {!canDownload && !downloading && (
              <p className="sidebar-hint">{downloadHint}</p>
            )}
          </div>
        </aside>

        <main className="canvas-area">
          <Preview
            file={activeFile}
            watermark={watermark}
          />
          <FileInfo file={activeFile} />

          {isBatch && (
            <div className="batch-nav">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onActiveIndexChange(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous file"
              >
                &larr;
              </button>
              <span className="batch-nav-label">
                {activeIndex + 1} / {files.length}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onActiveIndexChange(Math.min(files.length - 1, activeIndex + 1))}
                disabled={activeIndex === files.length - 1}
                aria-label="Next file"
              >
                &rarr;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
