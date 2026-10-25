import { drawWatermark, FONT_MAP } from './watermarkRenderer.js'
import instrumentSerifUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff?url'
import caveatUrl from '@fontsource/caveat/files/caveat-latin-700-normal.woff?url'
import geistMonoUrl from '@fontsource/geist-mono/files/geist-mono-latin-700-normal.woff?url'

/**
 * Draws a watermark into a PDF as vector shapes instead of an image: a few KB,
 * sharp at any zoom, and (since glyphs become paths, not text) invisible to
 * text extraction, so copy-paste and résumé parsers don't pick it up.
 *
 * Layout isn't reimplemented: drawWatermark runs against a recording context
 * and its fillText/drawImage calls are replayed as PDF operators.
 */

// Font files for text watermarks. Georgia and Futura are system fonts with no
// file we can ship, so they return null and the caller falls back to an image.
// Satoshi comes from Fontshare: copy Fonts/WEB/fonts/Satoshi-Bold.woff from
// https://www.fontshare.com/fonts/satoshi into public/fonts/. Until then it
// falls back too. Use .woff/.otf/.ttf; the font parser can't read WOFF2.
const FONT_FILES = {
  'Satoshi':          { url: `${import.meta.env.BASE_URL}fonts/Satoshi-Bold.woff` },
  // Only a regular weight exists; the canvas fakes bold, so we stroke to match
  'Instrument Serif': { url: instrumentSerifUrl, fauxBold: true },
  'Caveat':           { url: caveatUrl },
  'Geist Mono':       { url: geistMonoUrl },
}

const fontCache = new Map()

function loadFont(url) {
  if (!fontCache.has(url)) {
    fontCache.set(url, (async () => {
      try {
        const [{ parse }, res] = await Promise.all([import('opentype.js'), fetch(url)])
        if (!res.ok) return null
        return parse(await res.arrayBuffer())
      } catch {
        // Missing file (dev servers answer with index.html) or unreadable font
        return null
      }
    })())
  }
  return fontCache.get(url)
}

// opentype.js throws on some substitution tables it doesn't implement
// (Instrument Serif's glyph composition, for one), and can't be told to skip
// them. For those fonts, lay glyphs out one per character with kerning:
// enough for Latin text, minus ligatures.
const simpleLayoutFonts = new WeakSet()

function withLayout(font, shaped, simple) {
  if (!simpleLayoutFonts.has(font)) {
    try {
      return shaped()
    } catch {
      simpleLayoutFonts.add(font)
    }
  }
  return simple()
}

function simpleGlyphs(font, text) {
  const glyphs = Array.from(text, ch => font.charToGlyph(ch))
  // Pen position, in font units, at which each glyph starts
  let x = 0
  const offsets = glyphs.map((glyph, i) => {
    if (i > 0) x += glyphs[i - 1].advanceWidth + font.getKerningValue(glyphs[i - 1], glyph)
    return x
  })
  const width = glyphs.length ? x + glyphs[glyphs.length - 1].advanceWidth : 0
  return { glyphs, offsets, width }
}

function advanceWidth(font, text, fontSize) {
  return withLayout(font,
    () => font.getAdvanceWidth(text, fontSize),
    () => simpleGlyphs(font, text).width * fontSize / font.unitsPerEm)
}

// Glyph outlines in font units, y down, baseline at 0
function textPath(font, text) {
  return withLayout(font,
    () => font.getPath(text, 0, 0, font.unitsPerEm),
    () => {
      const { glyphs, offsets } = simpleGlyphs(font, text)
      const path = glyphs[0].getPath(0, 0, font.unitsPerEm)
      for (let i = 1; i < glyphs.length; i++) path.extend(glyphs[i].getPath(offsets[i], 0, font.unitsPerEm))
      return path
    })
}

// [a, b, c, d, e, f] maps (x, y) to (a*x + c*y + e, b*x + d*y + f), as in canvas and PDF
function multiply(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

let measureCtx = null

/**
 * The subset of CanvasRenderingContext2D that drawWatermark uses. Records
 * what would be drawn, with the transform and style in effect at the time.
 */
class RecordingContext {
  constructor(otFont, fontFamily) {
    this.otFont = otFont
    this.fontFamily = fontFamily
    this.ops = []
    this.unsupported = false
    this.matrix = [1, 0, 0, 1, 0, 0]
    this.globalAlpha = 1
    this.fillStyle = '#000000'
    this.textAlign = 'start'
    this.textBaseline = 'alphabetic'
    this.fontSize = 10
    this.stack = []
  }

  set font(value) {
    this.fontSize = Number(/([\d.]+)px/.exec(value)?.[1] ?? 10)
  }

  save() {
    const { matrix, globalAlpha, fillStyle, textAlign, textBaseline, fontSize } = this
    this.stack.push({ matrix, globalAlpha, fillStyle, textAlign, textBaseline, fontSize })
  }

  restore() {
    Object.assign(this, this.stack.pop())
  }

  translate(x, y) {
    this.matrix = multiply(this.matrix, [1, 0, 0, 1, x, y])
  }

  rotate(angle) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    this.matrix = multiply(this.matrix, [cos, sin, -sin, cos, 0, 0])
  }

  measureText(text) {
    return { width: this.textWidth(text) }
  }

  // Prefer the browser's own measurement: it shapes text fully (Caveat's
  // contextual alternates, for one), so tiles and alignment land exactly
  // where the preview puts them. Falls back to the font file if the web font
  // isn't loaded, since a fallback font's widths would be wrong.
  textWidth(text) {
    const font = `bold ${this.fontSize}px ${this.fontFamily}`
    if (this.fontFamily && document.fonts?.check(font)) {
      measureCtx ??= document.createElement('canvas').getContext('2d')
      measureCtx.font = font
      return measureCtx.measureText(text).width
    }
    return advanceWidth(this.otFont, text, this.fontSize)
  }

  fillText(text, x, y, maxWidth) {
    const font = this.otFont
    // A character the font file lacks would render as a box; the canvas would
    // have used a system fallback font, so let the caller use the image path
    for (const ch of text) {
      if (ch.trim() && font.charToGlyphIndex(ch) === 0) this.unsupported = true
    }

    const width = this.textWidth(text)
    const scaleX = maxWidth !== undefined && width > maxWidth ? maxWidth / width : 1
    const drawnW = width * scaleX
    // Fit the outlines to that width; any difference is ~1%
    const fit = width / advanceWidth(font, text, this.fontSize)
    const dx = this.textAlign === 'center' ? -drawnW / 2
      : this.textAlign === 'right' || this.textAlign === 'end' ? -drawnW
      : 0
    const em = this.fontSize / font.unitsPerEm
    // 'middle' centres the em box on y. Like the canvas, scale ascent and
    // descent to sum to 1em first; glyph paths have their baseline at 0.
    const { ascender: asc, descender: desc } = font
    const dy = this.textBaseline === 'middle' ? this.fontSize * (asc + desc) / (2 * (asc - desc)) : 0

    this.ops.push({
      type: 'text',
      text,
      matrix: multiply(this.matrix, [em * scaleX * fit, 0, 0, em, x + dx, y + dy]),
      alpha: this.globalAlpha,
      color: this.fillStyle,
    })
  }

  drawImage(image, x, y, w, h) {
    this.ops.push({
      type: 'image',
      image,
      // PDF images fill the unit square bottom-up; canvas y runs down
      matrix: multiply(this.matrix, [w, 0, 0, -h, x, y + h]),
      alpha: this.globalAlpha,
    })
  }
}

let colorCtx = null

// Normalise any CSS colour to 0..1 RGB plus alpha
function parseColor(style) {
  colorCtx ??= document.createElement('canvas').getContext('2d')
  colorCtx.fillStyle = '#000000'
  colorCtx.fillStyle = style
  const value = colorCtx.fillStyle
  if (value.startsWith('#')) {
    const n = parseInt(value.slice(1), 16)
    return { rgb: [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255], alpha: 1 }
  }
  const [r, g, b, a = 1] = value.match(/[\d.]+/g).map(Number)
  return { rgb: [r / 255, g / 255, b / 255], alpha: a }
}

/**
 * Builds the watermark for a page of the given displayed size as a PDF form
 * XObject spanning (0, 0)-(viewW, viewH). Returns its ref, or null when it
 * can't be drawn as vectors (no font file, unsupported characters).
 *
 * `cache` is shared across calls for one document so glyph runs and logos
 * are embedded once.
 */
export async function buildVectorWatermark(doc, pdfLib, viewW, viewH, config, cache) {
  const { PDFName, PDFNumber, PDFOperator } = pdfLib
  const context = doc.context
  const num = (v) => PDFNumber.of(Math.round(v * 1000) / 1000)
  const op = (name, ...args) => PDFOperator.of(name, args.map(a => typeof a === 'number' ? num(a) : a))

  let fontFile = null
  let otFont = null
  if (config.mode !== 'image') {
    // Unknown fonts render as Satoshi, as in drawWatermark
    fontFile = FONT_FILES[config.font in FONT_MAP ? config.font : 'Satoshi']
    if (!fontFile) return null
    otFont = await loadFont(fontFile.url)
    if (!otFont) return null
  }

  // Same canvas size the image overlay uses, so layout (and its 12px minimum
  // font size) comes out identical
  const cw = Math.round(viewW * 2)
  const ch = Math.round(viewH * 2)
  const rec = new RecordingContext(otFont, otFont && (FONT_MAP[config.font] || FONT_MAP['Satoshi']))
  drawWatermark(rec, cw, ch, config)
  if (rec.unsupported) return null

  const xObjects = {}
  const extGStates = {}
  const content = [op('cm', viewW / cw, 0, 0, -viewH / ch, 0, viewH)]

  for (const item of rec.ops) {
    const { rgb, alpha: colorAlpha } = item.type === 'text' ? parseColor(item.color) : { rgb: null, alpha: 1 }
    const alpha = Math.round(item.alpha * colorAlpha * 1000) / 1000
    const gsName = `G${alpha}`.replace('.', '_')
    extGStates[gsName] ??= context.obj({ Type: 'ExtGState', ca: alpha, CA: alpha })

    content.push(op('q'), op('gs', PDFName.of(gsName)))
    let xObject
    if (item.type === 'text') {
      content.push(op('rg', ...rgb), op('RG', ...rgb))
      xObject = glyphRun(item.text)
    } else {
      xObject = await embedLogo(item.image)
    }
    xObjects[xObject.name] = xObject.ref
    content.push(op('cm', ...item.matrix), op('Do', PDFName.of(xObject.name)), op('Q'))
  }

  const form = context.formXObject(content, {
    BBox: context.obj([0, 0, viewW, viewH]),
    Resources: context.obj({ XObject: xObjects, ExtGState: extGStates }),
  })
  return context.register(form)

  // One line of text as filled glyph outlines, in font units with y down
  // (matching the canvas). Shared by every tile and page that draws it.
  function glyphRun(text) {
    const key = `${fontFile.url}\n${text}`
    if (cache.glyphRuns.has(key)) return cache.glyphRuns.get(key)

    const path = textPath(otFont, text)
    // Whole font units: under 0.05pt at typical sizes, and much smaller output
    // for detailed fonts like Caveat
    const r = Math.round
    const ops = []
    let cx = 0
    let cy = 0
    for (const c of path.commands) {
      if (c.type === 'M') ops.push(op('m', r(c.x), r(c.y)))
      else if (c.type === 'L') ops.push(op('l', r(c.x), r(c.y)))
      else if (c.type === 'C') ops.push(op('c', r(c.x1), r(c.y1), r(c.x2), r(c.y2), r(c.x), r(c.y)))
      else if (c.type === 'Q') {
        // PDF has no quadratic curves; raise to the equivalent cubic
        ops.push(op('c',
          r(cx + (2 / 3) * (c.x1 - cx)), r(cy + (2 / 3) * (c.y1 - cy)),
          r(c.x + (2 / 3) * (c.x1 - c.x)), r(c.y + (2 / 3) * (c.y1 - c.y)),
          r(c.x), r(c.y)))
      } else if (c.type === 'Z') ops.push(op('h'))
      if (c.type !== 'Z') { cx = c.x; cy = c.y }
    }

    const stroke = fontFile.fauxBold ? otFont.unitsPerEm / 32 : 0
    if (stroke) ops.unshift(op('w', stroke), op('j', 1))
    ops.push(op(stroke ? 'B' : 'f'))

    const box = path.getBoundingBox()
    const ref = context.register(context.formXObject(ops, {
      BBox: context.obj([box.x1 - stroke, box.y1 - stroke, box.x2 + stroke, box.y2 + stroke]),
    }))
    const run = { name: `T${cache.glyphRuns.size}`, ref }
    cache.glyphRuns.set(key, run)
    return run
  }

  // Embed each logo once per document; PNGs as-is, other formats via canvas
  async function embedLogo(image) {
    if (cache.images.has(image)) return cache.images.get(image)

    let bytes
    if (image.src.startsWith('data:image/png')) {
      bytes = await (await fetch(image.src)).arrayBuffer()
    } else {
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      bytes = await (await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))).arrayBuffer()
    }
    const logo = { name: `I${cache.images.size}`, ref: (await doc.embedPng(bytes)).ref }
    cache.images.set(image, logo)
    return logo
  }
}

export function createVectorCache() {
  return { glyphRuns: new Map(), images: new Map() }
}
