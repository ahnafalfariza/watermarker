import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawWatermark, POSITION_MAP, FONT_MAP } from '../src/lib/watermarkRenderer.js'

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
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
    expect(ctx.fillText).toHaveBeenCalledWith('SAMPLE', 100, 80)
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
