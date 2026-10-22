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
 *
 * By default the watermark is overlaid on the original pages, so text,
 * vectors and embedded images are kept as-is and the output stays close to
 * the input size. With `flatten`, or for PDFs pdf-lib can't open (encrypted,
 * malformed), each page is rasterized with the watermark burned in instead.
 */
export async function processPdf(file, watermarkConfig, { flatten = false } = {}) {
  const { pdfLib } = await ensurePdfLibs()

  const arrayBuffer = await file.arrayBuffer()
  if (flatten) return rasterizePdf(file, arrayBuffer, watermarkConfig)

  let doc
  try {
    doc = await pdfLib.PDFDocument.load(arrayBuffer)
  } catch {
    return rasterizePdf(file, arrayBuffer, watermarkConfig)
  }

  // Pages with the same visible size share one embedded watermark image
  const overlayCache = new Map()

  for (const page of doc.getPages()) {
    const { x, y, width, height } = page.getCropBox()
    const rotation = ((page.getRotation().angle % 360) + 360) % 360
    const sideways = rotation === 90 || rotation === 270
    // Size of the page as the viewer displays it
    const viewW = sideways ? height : width
    const viewH = sideways ? width : height

    const key = `${viewW}x${viewH}`
    let overlay = overlayCache.get(key)
    if (!overlay) {
      overlay = await embedWatermarkOverlay(doc, viewW, viewH, watermarkConfig)
      overlayCache.set(key, overlay)
    }

    // Wrap existing content in q/Q so a transform it leaves behind
    // doesn't shift the watermark
    page.translateContent(0, 0)

    // Counter-rotate so the watermark reads upright in the rotated view
    const origin = {
      0:   { x,             y },
      90:  { x: x + width,  y },
      180: { x: x + width,  y: y + height },
      270: { x,             y: y + height },
    }[rotation] || { x, y }

    page.drawImage(overlay, {
      x: origin.x,
      y: origin.y,
      width: viewW,
      height: viewH,
      rotate: pdfLib.degrees(rotation),
    })
  }

  return await doc.save()
}

/**
 * Draw the watermark alone on a transparent canvas and embed it as a PNG.
 * Rendered at 2x the page size so text stays crisp when zoomed.
 */
async function embedWatermarkOverlay(doc, viewW, viewH, watermarkConfig) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewW * 2)
  canvas.height = Math.round(viewH * 2)
  const ctx = canvas.getContext('2d')

  drawWatermark(ctx, canvas.width, canvas.height, watermarkConfig)

  const pngData = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  const pngBytes = new Uint8Array(await pngData.arrayBuffer())
  return doc.embedPng(pngBytes)
}

/**
 * Render every page to an image with the watermark burned in, so it can't be
 * removed as a separate object. Larger output and text is no longer
 * selectable.
 */
async function rasterizePdf(file, arrayBuffer, watermarkConfig) {
  const { pdfjsLib, pdfLib } = await ensurePdfLibs()

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

    // PNG is smaller for text-heavy pages, JPEG for scans and photos
    const [pngData, jpgData] = await Promise.all([
      new Promise(resolve => canvas.toBlob(resolve, 'image/png')),
      new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92)),
    ])
    const useJpg = jpgData.size < pngData.size
    const bytes = new Uint8Array(await (useJpg ? jpgData : pngData).arrayBuffer())
    const pageImage = useJpg ? await destDoc.embedJpg(bytes) : await destDoc.embedPng(bytes)

    const destPage = destDoc.addPage([viewport.width / 2, viewport.height / 2])
    destPage.drawImage(pageImage, {
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
