import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFName, PDFRawStream, StandardFonts, degrees } from 'pdf-lib'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { processPdf } from '../../src/lib/pdfProcessor.js'
import { drawWatermark, loadLogoImage, loadWatermarkFont } from '../../src/lib/watermarkRenderer.js'
// The canvas side of the parity test needs the web fonts the app loads
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/caveat/latin-700.css'
import '@fontsource/geist-mono/latin-700.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const MARKER = 'Quarterly report body text'

// Opaque red so watermark pixels are easy to tell apart from the black page text.
// Georgia is a system font with no bundled file, so it takes the image overlay path.
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

// Image XObjects in the file (a PNG with transparency counts twice: image + mask)
async function imageCount(bytes) {
  const doc = await PDFDocument.load(bytes)
  let count = 0
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) count++
  }
  return count
}

async function redSquareLogo() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, 64, 32)
  return loadLogoImage(canvas.toDataURL('image/png'))
}

// Red pixels of a canvas as a 0/1 mask
function redMask(ctx) {
  const { data, width, height } = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const mask = new Uint8Array(width * height)
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4] > 150 && data[i * 4 + 1] < 120 ? 1 : 0
  return mask
}

function whiteCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  return ctx
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

describe('processPdf (vector watermark)', () => {
  const vector = { ...watermark, font: 'Geist Mono' }

  it('draws bundled fonts as shapes, not images or text', async () => {
    const file = await makeTextPdf(2)
    const out = await processPdf(file, vector)

    expect(await imageCount(out)).toBe(0)
    expect(await watermarkBox(out)).not.toBeNull()
    const texts = await pageTexts(out)
    texts.forEach((text, i) => {
      expect(text).toContain(`${MARKER} page ${i + 1}`)
      expect(text).not.toContain('CONFIDENTIAL')
    })
  })

  it.each(['Instrument Serif', 'Caveat', 'Geist Mono'])('adds only a few KB for a tiled %s watermark', async (font) => {
    const file = await makeTextPdf(10)
    const out = await processPdf(file, { ...vector, font, tiled: true })

    expect(await imageCount(out)).toBe(0)
    // The image overlay adds 70-190 KB here. Caveat's detailed handwriting
    // outlines are the largest at ~17 KB; Geist Mono adds ~5 KB
    expect(out.length).toBeLessThan(file.size + 20_000)
  })

  it.each([0, 90, 180, 270])('draws the watermark upright on a page rotated %i°', async (rotation) => {
    const out = await processPdf(await makeTextPdf(1, rotation), vector)

    const box = await watermarkBox(out)
    expect(box).not.toBeNull()
    expect(box.centerY).toBeLessThan(0.25)
    expect(box.centerX).toBeGreaterThan(0.4)
    expect(box.centerX).toBeLessThan(0.6)
    expect(box.aspect).toBeGreaterThan(2)
  })

  // What the image overlay would contain vs. the vector PDF rendered at the same
  // size, compared as overlap of watermark pixels (1 = identical). Caveat scores
  // lowest: the browser applies contextual letter alternates the font parser can't.
  it.each([
    ['Instrument Serif', false], ['Instrument Serif', true],
    ['Caveat', false], ['Caveat', true],
    ['Geist Mono', false], ['Geist Mono', true],
  ])('matches the canvas drawing for %s (tiled: %s)', async (font, tiled) => {
    const config = { ...vector, font, tiled, text: 'Confidential\nDo not share', position: 'center' }
    await loadWatermarkFont(config)
    const blank = await PDFDocument.create()
    blank.addPage([596, 842])
    const out = await processPdf(new File([await blank.save()], 'blank.pdf'), config)

    const page = await (await pdfjs.getDocument({ data: out }).promise).getPage(1)
    const fromPdf = whiteCanvas(1192, 1684)
    await page.render({ canvasContext: fromPdf, viewport: page.getViewport({ scale: 2 }) }).promise
    const fromCanvas = whiteCanvas(1192, 1684)
    drawWatermark(fromCanvas, 1192, 1684, config)

    const a = redMask(fromPdf)
    const b = redMask(fromCanvas)
    let both = 0
    let either = 0
    for (let i = 0; i < a.length; i++) {
      both += a[i] & b[i]
      either += a[i] | b[i]
    }
    expect(both / either).toBeGreaterThan(0.75)
  })

  it('falls back to an image for characters the font file lacks', async () => {
    const out = await processPdf(await makeTextPdf(1), { ...vector, text: '水印' })

    expect(await imageCount(out)).toBeGreaterThan(0)
    expect(await watermarkBox(out)).not.toBeNull()
  })

  it('embeds a tiled logo once', async () => {
    const logoElement = await redSquareLogo()
    const file = await makeTextPdf(3)
    const out = await processPdf(file, { ...watermark, mode: 'image', logoElement, tiled: true })

    expect(await imageCount(out)).toBeLessThanOrEqual(2)
    expect(await watermarkBox(out)).not.toBeNull()
    expect(out.length).toBeLessThan(file.size + 15_000)
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
