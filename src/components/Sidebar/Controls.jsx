import { useCallback, useRef } from 'react'
import { loadLogoImage } from '../../lib/watermarkRenderer.js'

const FONTS = [
  'Satoshi',
  'Instrument Serif',
  'Caveat',
  'Geist Mono',
  'Georgia',
  'Futura',
]

const COLOR_PRESETS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#EF4444', label: 'Red' },
  { value: '#0EA5E9', label: 'Blue' },
]

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB

export default function Controls({ watermark, onChange }) {
  const logoInputRef = useRef(null)

  const handleText = useCallback((e) => onChange('text', e.target.value), [onChange])
  const handleFont = useCallback((e) => onChange('font', e.target.value), [onChange])
  const handleSize = useCallback((e) => onChange('size', Number(e.target.value)), [onChange])
  const handleOpacity = useCallback((e) => onChange('opacity', Number(e.target.value)), [onChange])
  const handleColor = useCallback((e) => onChange('color', e.target.value), [onChange])

  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_LOGO_SIZE) {
      // Reset the input so the same file can be re-selected
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUri = ev.target.result
      try {
        const img = await loadLogoImage(dataUri)
        onChange('logoDataUri', dataUri)
        onChange('logoElement', img)
        onChange('logoFileName', file.name)
      } catch {
        // Failed to load — reset
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleRemoveLogo = useCallback(() => {
    onChange('logoDataUri', null)
    onChange('logoElement', null)
    onChange('logoFileName', null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }, [onChange])

  const isTextMode = watermark.mode !== 'image'

  return (
    <div className="controls">
      {/* Mode Toggle */}
      <div className="control-group">
        <label className="control-label">Watermark Type</label>
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${isTextMode ? 'mode-toggle-active' : ''}`}
            onClick={() => onChange('mode', 'text')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            Text
          </button>
          <button
            className={`mode-toggle-btn ${!isTextMode ? 'mode-toggle-active' : ''}`}
            onClick={() => onChange('mode', 'image')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>
        </div>
      </div>

      {isTextMode ? (
        <>
          {/* Text Controls */}
          <div className="control-group">
            <label className="control-label">Watermark Text</label>
            <input
              type="text"
              className="input"
              placeholder="Enter watermark text"
              value={watermark.text}
              onChange={handleText}
              autoFocus
            />
          </div>

          <div className="control-group">
            <label className="control-label">Font</label>
            <select className="input select" value={watermark.font} onChange={handleFont}>
              {FONTS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          {/* Image/Logo Controls */}
          <div className="control-group">
            <label className="control-label">Logo Image</label>
            {watermark.logoFileName ? (
              <div className="logo-preview">
                <img
                  src={watermark.logoDataUri}
                  alt="Logo preview"
                  className="logo-preview-img"
                />
                <div className="logo-preview-info">
                  <span className="logo-preview-name">{watermark.logoFileName}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemoveLogo}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="logo-upload-btn"
                onClick={() => logoInputRef.current?.click()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload PNG or SVG</span>
                <span className="logo-upload-hint">Max 5MB</span>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
          </div>
        </>
      )}

      {/* Shared controls: Size, Opacity */}
      <div className="control-group">
        <label className="control-label">
          Size
          <span className="control-value">{watermark.size}%</span>
        </label>
        <input
          type="range"
          className="slider"
          min="5"
          max="100"
          value={watermark.size}
          onChange={handleSize}
          aria-label={`Watermark size: ${watermark.size}%`}
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Opacity
          <span className="control-value">{watermark.opacity}%</span>
        </label>
        <input
          type="range"
          className="slider"
          min="0"
          max="100"
          value={watermark.opacity}
          onChange={handleOpacity}
          aria-label={`Watermark opacity: ${watermark.opacity}%`}
        />
        {watermark.opacity === 0 && (
          <p className="control-warning">Watermark will be invisible</p>
        )}
      </div>

      {/* Color — text mode only */}
      {isTextMode && (
        <div className="control-group">
          <label className="control-label">Color</label>
          <div className="color-picker">
            {COLOR_PRESETS.map(c => (
              <button
                key={c.value}
                className={`color-swatch ${watermark.color === c.value ? 'color-swatch-active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => onChange('color', c.value)}
                aria-label={c.label}
                title={c.label}
              />
            ))}
            <input
              type="color"
              className="color-input"
              value={watermark.color}
              onChange={handleColor}
              aria-label="Custom color"
            />
          </div>
        </div>
      )}
    </div>
  )
}
