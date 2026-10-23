import { describe, it, expect } from 'vitest'
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { processPdf } from '../../src/lib/pdfProcessor.js'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const MARKER = 'Quarterly report body text'

// Opaque red so watermark pixels are easy to tell apart from the black page text
const watermark = {
  mode: 'text',
  text: 'CONFIDENTIAL',
  font: 'Georgia',
  size: 30,
  opacity: 100,
  color: '#ff0000',
  position: 'top-center',
  tiled: false,
  tiledAngle: -30,
  tiledSpacing: 100,
}

async function makeTextPdf(pageCount, rotation = 0) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([612, 792])
    for (let line = 0; line < 40; line++) {
      page.drawText(`${MARKER} page ${i + 1} line ${line}`, { x: 40, y: 740 - line * 16, size: 10, font })
    }
    page.setRotation(degrees(rotation))
  }
  const bytes = await doc.save()
  return new File([bytes], 'test.pdf', { type: 'application/pdf' })
}

async function pageTexts(bytes) {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
  const texts = []
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    texts.push(content.items.map(item => item.str).join(' '))
  }
  return texts
}

// Bounding box of watermark-red pixels on page 1, as fractions of the page as displayed
async function watermarkBox(bytes) {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
  const page = await doc.getPage(1)
  const viewport = page.getViewport({ scale: 0.5 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i] > 200 && data[i + 1] < 80 && data[i + 2] < 80) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x)
        minY = Math.min(minY, y); maxY = Math.max(maxY, y)
      }
    }
  }
  if (maxX < 0) return null
  return {
    centerX: (minX + maxX) / 2 / width,
    centerY: (minY + maxY) / 2 / height,
    aspect: (maxX - minX) / (maxY - minY),
  }
}

describe('processPdf (overlay, default)', () => {
  it('keeps the original text on every page', async () => {
    const file = await makeTextPdf(3)
    const out = await processPdf(file, watermark)

    const texts = await pageTexts(out)
    expect(texts).toHaveLength(3)
    texts.forEach((text, i) => expect(text).toContain(`${MARKER} page ${i + 1}`))
  })

  it('stays close to the input size', async () => {
    const file = await makeTextPdf(10)
    const out = await processPdf(file, watermark)

    // Rasterizing every page (the old behaviour) produced megabytes here
    expect(out.length).toBeLessThan(file.size + 100_000)
  })

  it('embeds one watermark image for all pages of the same size', async () => {
    const one = await processPdf(await makeTextPdf(1), watermark)
    const ten = await processPdf(await makeTextPdf(10), watermark)

    // Nine extra pages of text cost a few KB each; a duplicate overlay per page would cost far more
    expect(ten.length - one.length).toBeLessThan(40_000)
  })

  it.each([0, 90, 180, 270])('draws the watermark upright on a page rotated %i°', async (rotation) => {
    const out = await processPdf(await makeTextPdf(1, rotation), watermark)

    const box = await watermarkBox(out)
    expect(box).not.toBeNull()
    expect(box.centerY).toBeLessThan(0.25) // top-center, as the viewer shows the page
    expect(box.centerX).toBeGreaterThan(0.4)
    expect(box.centerX).toBeLessThan(0.6)
    expect(box.aspect).toBeGreaterThan(2) // horizontal text, not turned sideways
  })
})

describe('processPdf (flatten)', () => {
  it('burns the watermark in so no text remains', async () => {
    const file = await makeTextPdf(2)
    const out = await processPdf(file, watermark, { flatten: true })

    const texts = await pageTexts(out)
    expect(texts).toEqual(['', ''])
    expect(await watermarkBox(out)).not.toBeNull()
  })

  it('keeps the page count and page size', async () => {
    const out = await processPdf(await makeTextPdf(2), watermark, { flatten: true })

    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(2)
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
  })
})
