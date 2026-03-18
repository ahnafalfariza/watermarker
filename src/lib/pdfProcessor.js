import { drawWatermark } from './watermarkRenderer.js'

let pdfjsLib = null
let pdfLib = null

/**
 * Lazy-load PDF.js and pdf-lib on first use.
 */
async function ensurePdfLibs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  }
  if (!pdfLib) {
    pdfLib = await import('pdf-lib')
  }
  return { pdfjsLib, pdfLib }
}

/**
 * Render a single PDF page to canvas for preview.
 */
export async function renderPdfPage(file, pageNum, watermarkConfig, maxSize = 800) {
  const { pdfjsLib } = await ensurePdfLibs()

  const arrayBuffer = await file.arrayBuffer()
  let doc
  try {
    doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    if (err.name === 'PasswordException') {
      throw new Error('PDF is password-protected. Remove the password and try again.')
    }
    throw new Error(`Could not read ${file.name}. PDF appears corrupt.`)
  }

  const page = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1 })

  const scale = Math.min(1, maxSize / Math.max(viewport.width, viewport.height))
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(scaledViewport.width)
  canvas.height = Math.round(scaledViewport.height)
  const ctx = canvas.getContext('2d')

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise

  drawWatermark(ctx, canvas.width, canvas.height, watermarkConfig)

  return { canvas, numPages: doc.numPages }
}

/**
 * Process a PDF and apply watermark to all pages.
 * Returns a Uint8Array of the watermarked PDF.
 */
export async function processPdf(file, watermarkConfig) {
  const { pdfjsLib, pdfLib } = await ensurePdfLibs()

  const arrayBuffer = await file.arrayBuffer()
  let srcDoc
  try {
    srcDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    if (err.name === 'PasswordException') {
      throw new Error('PDF is password-protected. Remove the password and try again.')
    }
    throw new Error(`Could not read ${file.name}. PDF appears corrupt.`)
  }

  // Create a new PDF with pdf-lib, embedding watermarked page images
  const destDoc = await pdfLib.PDFDocument.create()

  for (let i = 1; i <= srcDoc.numPages; i++) {
    const page = await srcDoc.getPage(i)
    const viewport = page.getViewport({ scale: 2 }) // 2x for quality

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')

    await page.render({ canvasContext: ctx, viewport }).promise
    drawWatermark(ctx, canvas.width, canvas.height, watermarkConfig)

    const pngData = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const pngBytes = new Uint8Array(await pngData.arrayBuffer())
    const pngImage = await destDoc.embedPng(pngBytes)

    const destPage = destDoc.addPage([viewport.width / 2, viewport.height / 2])
    destPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: viewport.width / 2,
      height: viewport.height / 2,
    })
  }

  return await destDoc.save()
}

export async function getPdfPageCount(file) {
  const { pdfjsLib } = await ensurePdfLibs()
  const arrayBuffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  return doc.numPages
}
