import { useCallback } from 'react'

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

export default function Controls({ watermark, onChange }) {
  const handleText = useCallback((e) => onChange('text', e.target.value), [onChange])
  const handleFont = useCallback((e) => onChange('font', e.target.value), [onChange])
  const handleSize = useCallback((e) => onChange('size', Number(e.target.value)), [onChange])
  const handleOpacity = useCallback((e) => onChange('opacity', Number(e.target.value)), [onChange])
  const handleColor = useCallback((e) => onChange('color', e.target.value), [onChange])

  return (
    <div className="controls">
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
    </div>
  )
}
