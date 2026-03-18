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

export function drawWatermark(ctx, width, height, config) {
  if (config.mode === 'image') {
    drawImageWatermark(ctx, width, height, config)
  } else {
    drawTextWatermark(ctx, width, height, config)
  }
}

function drawTextWatermark(ctx, width, height, config) {
  const { text, font, size, opacity, color, position, tiled, tiledAngle, tiledSpacing } = config

  if (!text) return

  const fontFamily = FONT_MAP[font] || FONT_MAP['Satoshi']
  const minDim = Math.min(width, height)
  const fontSize = Math.max(12, Math.round((size / 100) * minDim * 0.5))

  ctx.save()
  ctx.globalAlpha = opacity / 100
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (tiled) {
    const relativeSpacing = (tiledSpacing / 500) * minDim * 0.5
    drawTiledText(ctx, width, height, text, fontSize, tiledAngle, relativeSpacing)
  } else {
    const pos = POSITION_MAP[position] || POSITION_MAP['center']
    const x = width * pos.x
    const y = height * pos.y
    ctx.fillText(text, x, y)
  }

  ctx.restore()
}

function drawTiledText(ctx, width, height, text, fontSize, angle, spacing) {
  const radians = (angle * Math.PI) / 180
  const gap = Math.max(fontSize * 1.5, spacing)
  const diagonal = Math.sqrt(width * width + height * height)

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate(radians)

  const startX = -diagonal
  const startY = -diagonal

  for (let y = startY; y < diagonal; y += gap) {
    for (let x = startX; x < diagonal; x += gap * 2) {
      ctx.fillText(text, x, y)
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
    const x = width * pos.x - logoW / 2
    const y = height * pos.y - logoH / 2
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
