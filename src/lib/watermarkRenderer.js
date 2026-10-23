/**
 * Shared watermark renderer — draws watermark text or image onto a canvas context.
 * Used by both image and PDF processors for DRY watermark drawing.
 */

const POSITION_MAP = {
  'top-left':      { x: 0.1,  y: 0.1  },
  'top-center':    { x: 0.5,  y: 0.1  },
  'top-right':     { x: 0.9,  y: 0.1  },
  'center-left':   { x: 0.1,  y: 0.5  },
  'center':        { x: 0.5,  y: 0.5  },
  'center-right':  { x: 0.9,  y: 0.5  },
  'bottom-left':   { x: 0.1,  y: 0.9  },
  'bottom-center': { x: 0.5,  y: 0.9  },
  'bottom-right':  { x: 0.9,  y: 0.9  },
}

// Font mapping for watermark fonts
const FONT_MAP = {
  'Satoshi':        "'Satoshi', sans-serif",
  'Instrument Serif': "'Instrument Serif', serif",
  'Caveat':         "'Caveat', cursive",
  'Geist Mono':     "'Geist Mono', monospace",
  'Georgia':        "Georgia, serif",
  'Futura':         "'Futura', 'Century Gothic', sans-serif",
}

/**
 * Load and cache a logo image from a data URI.
 * Returns an HTMLImageElement ready for drawImage.
 */
const logoCache = new Map()

export function loadLogoImage(dataUri) {
  if (logoCache.has(dataUri)) return Promise.resolve(logoCache.get(dataUri))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      logoCache.set(dataUri, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error('Could not load logo image.'))
    img.src = dataUri
  })
}

/**
 * Resolves once the watermark font has loaded. Canvases don't wait for web
 * fonts and would otherwise draw the first frame in a fallback font.
 */
export function loadWatermarkFont(config) {
  if (config.mode === 'image' || typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  const fontFamily = FONT_MAP[config.font] || FONT_MAP['Satoshi']
  return document.fonts.load(`bold 16px ${fontFamily}`).catch(() => {})
}

export function drawWatermark(ctx, width, height, config) {
  if (config.mode === 'image') {
    drawImageWatermark(ctx, width, height, config)
  } else {
    drawTextWatermark(ctx, width, height, config)
  }
}

// Line height as a multiple of font size for multi-line text
const LINE_HEIGHT = 1.2

function drawTextWatermark(ctx, width, height, config) {
  const { text, font, size, opacity, color, position, tiled, tiledAngle, tiledSpacing } = config

  if (!text || !text.trim()) return

  const lines = text.split(/\r?\n/)
  const fontFamily = FONT_MAP[font] || FONT_MAP['Satoshi']
  const minDim = Math.min(width, height)
  const fontSize = Math.max(12, Math.round((size / 100) * minDim * 0.5))
  const lineHeight = fontSize * LINE_HEIGHT

  ctx.save()
  ctx.globalAlpha = opacity / 100
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (tiled) {
    const relativeSpacing = (tiledSpacing / 500) * minDim * 0.5
    drawTiledText(ctx, width, height, lines, fontSize, lineHeight, tiledAngle, relativeSpacing)
  } else {
    const pos = POSITION_MAP[position] || POSITION_MAP['center']
    const lineWidths = lines.map(line => ctx.measureText(line).width)
    const blockW = Math.max(...lineWidths)
    const blockH = fontSize + (lines.length - 1) * lineHeight
    const halfW = Math.min(blockW / 2, width / 2)
    const halfH = Math.min(blockH / 2, height / 2)
    const x = Math.max(halfW, Math.min(width - halfW, width * pos.x))
    const y = Math.max(halfH, Math.min(height - halfH, height * pos.y))
    // Compress all lines by the same factor if the block is wider than the canvas
    const scale = blockW > width ? width / blockW : 1

    // Align multi-line text to the side it sits on so corner placements look natural
    let lineX = x
    if (lines.length > 1 && pos.x < 0.5) {
      ctx.textAlign = 'left'
      lineX = x - halfW
    } else if (lines.length > 1 && pos.x > 0.5) {
      ctx.textAlign = 'right'
      lineX = x + halfW
    }

    const firstY = y - (lines.length - 1) * lineHeight / 2
    lines.forEach((line, i) => {
      const maxWidth = scale < 1 ? lineWidths[i] * scale : undefined
      ctx.fillText(line, lineX, firstY + i * lineHeight, maxWidth)
    })
  }

  ctx.restore()
}

function drawTiledText(ctx, width, height, lines, fontSize, lineHeight, angle, spacing) {
  const radians = (angle * Math.PI) / 180
  const blockExtra = (lines.length - 1) * lineHeight
  const gap = Math.max(fontSize * 1.5, spacing)
  const blockW = Math.max(...lines.map(line => ctx.measureText(line).width))
  // Tiles must clear the full text block so neighbours don't overlap
  const gapX = Math.max(gap * 2, blockW + fontSize)
  const gapY = gap + blockExtra
  const diagonal = Math.sqrt(width * width + height * height)

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(radians)

  const startX = -diagonal
  const startY = -diagonal

  for (let y = startY; y < diagonal; y += gapY) {
    for (let x = startX; x < diagonal; x += gapX) {
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y - blockExtra / 2 + i * lineHeight)
      })
    }
  }

  ctx.restore()
}

function drawImageWatermark(ctx, width, height, config) {
  const { logoElement, size, opacity, position, tiled, tiledAngle, tiledSpacing } = config

  if (!logoElement) return

  const minDim = Math.min(width, height)
  // Scale logo: size% of the smaller dimension
  const logoW = Math.max(16, Math.round((size / 100) * minDim * 0.6))
  const logoH = Math.round(logoW * (logoElement.naturalHeight / logoElement.naturalWidth))

  ctx.save()
  ctx.globalAlpha = opacity / 100

  if (tiled) {
    drawTiledImage(ctx, width, height, logoElement, logoW, logoH, tiledAngle, tiledSpacing, minDim)
  } else {
    const pos = POSITION_MAP[position] || POSITION_MAP['center']
    const x = Math.max(0, Math.min(width - logoW, width * pos.x - logoW / 2))
    const y = Math.max(0, Math.min(height - logoH, height * pos.y - logoH / 2))
    ctx.drawImage(logoElement, x, y, logoW, logoH)
  }

  ctx.restore()
}

function drawTiledImage(ctx, width, height, logoElement, logoW, logoH, angle, spacing, minDim) {
  const radians = (angle * Math.PI) / 180
  const relativeSpacing = (spacing / 500) * minDim * 0.5
  const gapX = Math.max(logoW * 1.5, relativeSpacing * 2)
  const gapY = Math.max(logoH * 1.5, relativeSpacing)
  const diagonal = Math.sqrt(width * width + height * height)

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(radians)

  for (let y = -diagonal; y < diagonal; y += gapY) {
    for (let x = -diagonal; x < diagonal; x += gapX) {
      ctx.drawImage(logoElement, x - logoW / 2, y - logoH / 2, logoW, logoH)
    }
  }

  ctx.restore()
}

export { POSITION_MAP, FONT_MAP }
