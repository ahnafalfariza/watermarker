/**
 * Shared watermark renderer — draws watermark text onto a canvas context.
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

export function drawWatermark(ctx, width, height, config) {
  const { text, font, size, opacity, color, position, tiled, tiledAngle, tiledSpacing } = config

  if (!text) return

  const fontFamily = FONT_MAP[font] || FONT_MAP['Satoshi']
  const minDim = Math.min(width, height)
  // Scale font size relative to image dimensions (size is a percentage-like value)
  const fontSize = Math.max(12, Math.round((size / 100) * minDim * 0.5))

  ctx.save()
  ctx.globalAlpha = opacity / 100
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (tiled) {
    // Scale spacing relative to image dimensions, same as font size
    const relativeSpacing = (tiledSpacing / 500) * minDim * 0.5
    drawTiledWatermark(ctx, width, height, text, fontSize, tiledAngle, relativeSpacing)
  } else {
    const pos = POSITION_MAP[position] || POSITION_MAP['center']
    const x = width * pos.x
    const y = height * pos.y
    ctx.fillText(text, x, y)
  }

  ctx.restore()
}

function drawTiledWatermark(ctx, width, height, text, fontSize, angle, spacing) {
  const radians = (angle * Math.PI) / 180
  const gap = Math.max(fontSize * 1.5, spacing)

  // Calculate the diagonal to ensure full coverage when rotated
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

export { POSITION_MAP, FONT_MAP }
