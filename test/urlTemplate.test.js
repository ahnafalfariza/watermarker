import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encodeTemplateUrl, parseTemplateUrl } from '../src/lib/urlTemplate.js'

// Mock window.location for encodeTemplateUrl
const originalLocation = window.location

beforeEach(() => {
  delete window.location
  window.location = {
    origin: 'https://watermark.app',
    pathname: '/',
    search: '',
  }
})

afterEach(() => {
  window.location = originalLocation
})

describe('encodeTemplateUrl', () => {
  it('returns null when all values are defaults', () => {
    const config = {
      mode: 'text',
      text: '',
      font: 'Satoshi',
      size: 48,
      opacity: 50,
      color: '#FFFFFF',
      position: 'center',
      tiled: false,
      tiledAngle: -30,
      tiledSpacing: 200,
    }
    expect(encodeTemplateUrl(config)).toBeNull()
  })

  it('encodes only non-default values', () => {
    const config = {
      mode: 'text',
      text: 'CONFIDENTIAL',
      font: 'Satoshi',
      size: 48,
      opacity: 30,
      color: '#FFFFFF',
      position: 'center',
      tiled: false,
      tiledAngle: -30,
      tiledSpacing: 200,
    }
    const url = encodeTemplateUrl(config)
    expect(url).toContain('t=CONFIDENTIAL')
    expect(url).toContain('o=30')
    // Should NOT include default values
    expect(url).not.toContain('m=text')
    expect(url).not.toContain('f=Satoshi')
    expect(url).not.toContain('s=48')
  })

  it('encodes tiled as 1/0', () => {
    const config = { tiled: true, tiledAngle: -30, tiledSpacing: 200 }
    const url = encodeTemplateUrl(config)
    expect(url).toContain('tl=1')
  })

  it('builds a full URL with origin and pathname', () => {
    const config = { text: 'DRAFT' }
    const url = encodeTemplateUrl(config)
    expect(url).toMatch(/^https:\/\/watermark\.app\/\?/)
  })

  it('skips null and undefined values', () => {
    const config = { text: 'TEST', logoDataUri: null, logoElement: undefined }
    const url = encodeTemplateUrl(config)
    expect(url).toContain('t=TEST')
    expect(url).not.toContain('logo')
  })
})

describe('parseTemplateUrl', () => {
  it('returns null for empty search string', () => {
    expect(parseTemplateUrl('')).toBeNull()
  })

  it('returns null when no recognized params are present', () => {
    expect(parseTemplateUrl('?foo=bar&baz=qux')).toBeNull()
  })

  it('parses text and opacity', () => {
    const config = parseTemplateUrl('?t=CONFIDENTIAL&o=30')
    expect(config).toEqual({ text: 'CONFIDENTIAL', opacity: 30 })
  })

  it('parses all fields', () => {
    const config = parseTemplateUrl('?m=text&t=DRAFT&f=Georgia&s=72&o=25&c=%23FF0000&p=top-left&tl=1&ta=-45&ts=150')
    expect(config).toEqual({
      mode: 'text',
      text: 'DRAFT',
      font: 'Georgia',
      size: 72,
      opacity: 25,
      color: '#FF0000',
      position: 'top-left',
      tiled: true,
      tiledAngle: -45,
      tiledSpacing: 150,
    })
  })

  it('rejects invalid font', () => {
    const config = parseTemplateUrl('?f=ComicSans')
    expect(config.font).toBeUndefined()
  })

  it('rejects invalid position', () => {
    const config = parseTemplateUrl('?p=middle')
    expect(config.position).toBeUndefined()
  })

  it('rejects invalid color format', () => {
    const config = parseTemplateUrl('?c=red')
    expect(config.color).toBeUndefined()
  })

  it('clamps size to valid range', () => {
    const config = parseTemplateUrl('?s=999')
    expect(config.size).toBe(100)
  })

  it('clamps opacity to valid range', () => {
    const config = parseTemplateUrl('?o=-5')
    expect(config.opacity).toBe(0)
  })

  it('clamps tiledAngle to valid range', () => {
    const config = parseTemplateUrl('?ta=180')
    expect(config.tiledAngle).toBe(90)
  })

  it('clamps tiledSpacing to valid range', () => {
    const config = parseTemplateUrl('?ts=10')
    expect(config.tiledSpacing).toBe(80)
  })

  it('truncates text to 200 characters', () => {
    const longText = 'A'.repeat(300)
    const config = parseTemplateUrl(`?t=${longText}`)
    expect(config.text).toHaveLength(200)
  })

  it('uppercases color hex', () => {
    const config = parseTemplateUrl('?c=%23aabbcc')
    expect(config.color).toBe('#AABBCC')
  })

  it('rejects invalid mode', () => {
    const config = parseTemplateUrl('?m=video')
    expect(config.mode).toBeUndefined()
  })

  it('handles tiled boolean correctly', () => {
    expect(parseTemplateUrl('?tl=1').tiled).toBe(true)
    expect(parseTemplateUrl('?tl=0').tiled).toBe(false)
    expect(parseTemplateUrl('?tl=yes').tiled).toBeUndefined()
  })
})

describe('roundtrip encode → parse', () => {
  it('preserves non-default config through encode → parse', () => {
    const config = {
      mode: 'text',
      text: 'CONFIDENTIAL',
      font: 'Georgia',
      size: 72,
      opacity: 25,
      color: '#FF0000',
      position: 'top-left',
      tiled: true,
      tiledAngle: -45,
      tiledSpacing: 150,
    }
    const url = encodeTemplateUrl(config)
    const search = '?' + url.split('?')[1]
    const parsed = parseTemplateUrl(search)

    // Only non-default values should be in parsed output
    expect(parsed.text).toBe('CONFIDENTIAL')
    expect(parsed.font).toBe('Georgia')
    expect(parsed.size).toBe(72)
    expect(parsed.opacity).toBe(25)
    expect(parsed.color).toBe('#FF0000')
    expect(parsed.position).toBe('top-left')
    expect(parsed.tiled).toBe(true)
    expect(parsed.tiledAngle).toBe(-45)
    expect(parsed.tiledSpacing).toBe(150)
  })
})
