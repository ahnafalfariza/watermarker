import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawWatermark, POSITION_MAP, FONT_MAP } from '../src/lib/watermarkRenderer.js'

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    // Fixed-width glyphs: 10px per character
    measureText: vi.fn((t) => ({ width: t.length * 10 })),
    translate: vi.fn(),
    rotate: vi.fn(),
    globalAlpha: 1,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  }
}

describe('drawWatermark', () => {
  let ctx

  beforeEach(() => {
    ctx = createMockCtx()
  })

  it('does nothing when text is empty', () => {
    drawWatermark(ctx, 800, 600, { text: '', font: 'Satoshi', size: 48, opacity: 50, color: '#FFF', position: 'center', tiled: false })
    expect(ctx.save).not.toHaveBeenCalled()
  })

  it('draws single watermark at correct position', () => {
    drawWatermark(ctx, 1000, 800, {
      text: 'SAMPLE', font: 'Satoshi', size: 48, opacity: 50,
      color: '#FFFFFF', position: 'top-left', tiled: false,
    })
    expect(ctx.globalAlpha).toBe(0.5)
    expect(ctx.fillStyle).toBe('#FFFFFF')
    // fontSize = 192, so y is clamped from 80 to 96 to keep the text inside the canvas
    expect(ctx.fillText).toHaveBeenCalledWith('SAMPLE', 100, 96, undefined)
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })

  it('scales font size relative to image dimensions', () => {
    // size=48 on 1000x800 image: minDim=800, fontSize = round((48/100)*800*0.5) = 192
    drawWatermark(ctx, 1000, 800, {
      text: 'TEST', font: 'Satoshi', size: 48, opacity: 100,
      color: '#000', position: 'center', tiled: false,
    })
    expect(ctx.font).toContain('192px')
  })

  it('uses tiled mode when tiled is true', () => {
    drawWatermark(ctx, 800, 600, {
      text: 'TILED', font: 'Satoshi', size: 20, opacity: 30,
      color: '#FF0000', position: 'center', tiled: true, tiledAngle: -30, tiledSpacing: 200,
    })
    // Tiled mode translates to center and rotates
    expect(ctx.translate).toHaveBeenCalled()
    expect(ctx.rotate).toHaveBeenCalled()
    // Should draw multiple text instances
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(1)
  })

  it('draws each line of multi-line text on its own row', () => {
    // size=10 on 1000x800: fontSize = 40, lineHeight = 48
    drawWatermark(ctx, 1000, 800, {
      text: 'LINE ONE\nTWO', font: 'Satoshi', size: 10, opacity: 100,
      color: '#000', position: 'center', tiled: false,
    })
    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, 'LINE ONE', 500, 376, undefined)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, 'TWO', 500, 424, undefined)
  })

  it('left-aligns multi-line text on left positions', () => {
    drawWatermark(ctx, 1000, 800, {
      text: 'LONGER\nAB', font: 'Satoshi', size: 10, opacity: 100,
      color: '#000', position: 'center-left', tiled: false,
    })
    expect(ctx.textAlign).toBe('left')
    // Block is 60px wide centered at x=100, so both lines start at x=70
    expect(ctx.fillText.mock.calls[0][1]).toBe(70)
    expect(ctx.fillText.mock.calls[1][1]).toBe(70)
  })

  it('keeps a multi-line block inside the canvas vertically', () => {
    drawWatermark(ctx, 1000, 800, {
      text: 'A\nB\nC', font: 'Satoshi', size: 10, opacity: 100,
      color: '#000', position: 'top-center', tiled: false,
    })
    // Block height = 40 + 2*48 = 136, so the first line must not start above y=20
    const firstY = ctx.fillText.mock.calls[0][2]
    expect(firstY - 20).toBeGreaterThanOrEqual(0)
  })

  it('handles Windows line endings', () => {
    drawWatermark(ctx, 1000, 800, {
      text: 'A\r\nB', font: 'Satoshi', size: 10, opacity: 100,
      color: '#000', position: 'center', tiled: false,
    })
    expect(ctx.fillText.mock.calls.map(c => c[0])).toEqual(['A', 'B'])
  })

  it('does nothing when text is only whitespace and newlines', () => {
    drawWatermark(ctx, 800, 600, { text: ' \n\n ', font: 'Satoshi', size: 48, opacity: 50, color: '#FFF', position: 'center', tiled: false })
    expect(ctx.save).not.toHaveBeenCalled()
  })

  it('draws every line in each tile when tiled', () => {
    drawWatermark(ctx, 800, 600, {
      text: 'ONE\nTWO', font: 'Satoshi', size: 20, opacity: 30,
      color: '#FF0000', position: 'center', tiled: true, tiledAngle: -30, tiledSpacing: 200,
    })
    const texts = ctx.fillText.mock.calls.map(c => c[0])
    expect(texts.filter(t => t === 'ONE').length).toBe(texts.filter(t => t === 'TWO').length)
    expect(texts).not.toContain('ONE\nTWO')
  })

  it('falls back to Satoshi when unknown font is given', () => {
    drawWatermark(ctx, 400, 400, {
      text: 'X', font: 'UnknownFont', size: 10, opacity: 100,
      color: '#000', position: 'center', tiled: false,
    })
    expect(ctx.font).toContain('Satoshi')
  })
})

describe('POSITION_MAP', () => {
  it('has 9 positions', () => {
    expect(Object.keys(POSITION_MAP)).toHaveLength(9)
  })

  it('center is at 0.5, 0.5', () => {
    expect(POSITION_MAP['center']).toEqual({ x: 0.5, y: 0.5 })
  })
})

describe('FONT_MAP', () => {
  it('has entries for all 6 fonts', () => {
    expect(Object.keys(FONT_MAP)).toHaveLength(6)
    expect(FONT_MAP).toHaveProperty('Satoshi')
    expect(FONT_MAP).toHaveProperty('Geist Mono')
  })
})
