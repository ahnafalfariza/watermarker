import { drawWatermark } from './watermarkRenderer.js'

/**
 * Process an image file and apply watermark.
 * Returns a Blob of the watermarked image.
 */
export async function processImage(file, watermarkConfig, outputFormat = 'image/png') {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  // Validate canvas size (browser limits ~16384px or ~268M pixels)
  const pixels = canvas.width * canvas.height
  if (pixels > 268435456) {
    throw new Error(`Image too large to process (${canvas.width}x${canvas.height}). Try a smaller image.`)
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context.')

  ctx.drawImage(img, 0, 0)
  drawWatermark(ctx, canvas.width, canvas.height, watermarkConfig)

  const blob = await canvasToBlob(canvas, outputFormat)
  if (!blob) throw new Error('Failed to encode watermarked image. Try a different format.')

  return blob
}

/**
 * Generate a preview (smaller version for live display).
 */
export async function generatePreview(file, watermarkConfig, maxSize = 800) {
  const img = await loadImage(file)

  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context.')

  ctx.drawImage(img, 0, 0, width, height)
  drawWatermark(ctx, width, height, watermarkConfig)

  return canvas
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}. File may be corrupt.`))
    }
    img.src = url
  })
}

function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}
