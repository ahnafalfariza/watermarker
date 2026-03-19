/**
 * Shareable Template URLs
 *
 * Encodes watermark config as compact URL search params.
 * Only non-default values are included to keep URLs short.
 * Logo data URIs are excluded (too large for URLs).
 */

const DEFAULTS = {
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

// Short param keys to minimize URL length
const KEY_MAP = {
  mode: 'm',
  text: 't',
  font: 'f',
  size: 's',
  opacity: 'o',
  color: 'c',
  position: 'p',
  tiled: 'tl',
  tiledAngle: 'ta',
  tiledSpacing: 'ts',
}

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
)

const VALID_FONTS = ['Satoshi', 'Instrument Serif', 'Caveat', 'Geist Mono', 'Georgia', 'Futura']
const VALID_POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

/**
 * Encode a watermark config into URL search params string.
 * Only includes values that differ from defaults.
 */
export function encodeTemplateUrl(config) {
  const params = new URLSearchParams()

  for (const [key, shortKey] of Object.entries(KEY_MAP)) {
    const value = config[key]
    const defaultValue = DEFAULTS[key]

    if (value === undefined || value === null) continue
    if (value === defaultValue) continue

    if (typeof value === 'boolean') {
      params.set(shortKey, value ? '1' : '0')
    } else {
      params.set(shortKey, String(value))
    }
  }

  const qs = params.toString()
  return qs ? `${window.location.origin}${window.location.pathname}?${qs}` : null
}

/**
 * Parse URL search params into a partial watermark config.
 * Returns null if no template params are present.
 * Validates and clamps all values.
 */
export function parseTemplateUrl(search) {
  const params = new URLSearchParams(search)
  if (params.size === 0) return null

  const config = {}
  let hasTemplateParam = false

  for (const [shortKey, raw] of params.entries()) {
    const key = REVERSE_KEY_MAP[shortKey]
    if (!key) continue

    hasTemplateParam = true
    const parsed = parseValue(key, raw)
    if (parsed !== null) {
      config[key] = parsed
    }
  }

  return hasTemplateParam ? config : null
}

function parseValue(key, raw) {
  switch (key) {
    case 'mode':
      return raw === 'text' || raw === 'image' ? raw : null

    case 'text':
      return raw.slice(0, 200) // cap length

    case 'font':
      return VALID_FONTS.includes(raw) ? raw : null

    case 'size':
      return clampInt(raw, 5, 100)

    case 'opacity':
      return clampInt(raw, 0, 100)

    case 'color':
      return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : null

    case 'position':
      return VALID_POSITIONS.includes(raw) ? raw : null

    case 'tiled':
      return raw === '1' ? true : raw === '0' ? false : null

    case 'tiledAngle':
      return clampInt(raw, -90, 90)

    case 'tiledSpacing':
      return clampInt(raw, 80, 500)

    default:
      return null
  }
}

function clampInt(raw, min, max) {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return null
  return Math.max(min, Math.min(max, n))
}
