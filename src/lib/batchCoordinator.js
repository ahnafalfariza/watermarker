import { processImage } from './imageProcessor.js'
import { processPdf } from './pdfProcessor.js'

const CHUNK_SIZE = 5

/**
 * Process multiple files in batches, applying watermark to each.
 * Yields progress updates as files are processed.
 *
 * @param {File[]} files
 * @param {object} watermarkConfig
 * @param {function} onProgress - Called with { completed, total, currentFile, status }
 * @param {object} [options]
 * @param {boolean} [options.flattenPdf] - Burn the watermark into PDF pages
 * @returns {Promise<{results: Array<{file: File, blob: Blob|Uint8Array, success: boolean, error?: string}>}>}
 */
export async function processBatch(files, watermarkConfig, onProgress, { flattenPdf = false } = {}) {
  const results = []
  let completed = 0

  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE)
    const chunkPromises = chunk.map(async (file) => {
      onProgress?.({
        completed,
        total: files.length,
        currentFile: file.name,
        status: 'processing',
      })

      try {
        let output
        if (file.type === 'application/pdf') {
          const pdfBytes = await processPdf(file, watermarkConfig, { flatten: flattenPdf })
          output = new Blob([pdfBytes], { type: 'application/pdf' })
        } else {
          output = await processImage(file, watermarkConfig, file.type)
        }
        return { file, blob: output, success: true }
      } catch (err) {
        return { file, blob: null, success: false, error: err.message }
      }
    })

    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
    completed += chunk.length
    onProgress?.({
      completed,
      total: files.length,
      currentFile: null,
      status: completed === files.length ? 'done' : 'processing',
    })
  }

  return { results }
}

/**
 * Create a ZIP file from processed results.
 */
export async function createZip(results) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  const succeeded = results.filter(r => r.success)
  for (const result of succeeded) {
    const ext = result.file.type === 'application/pdf' ? '.pdf' : getExtension(result.file.name)
    const baseName = result.file.name.replace(/\.[^.]+$/, '')
    zip.file(`${baseName}_watermarked${ext}`, result.blob)
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return blob
}

function getExtension(filename) {
  const match = filename.match(/\.[^.]+$/)
  return match ? match[0] : '.png'
}
