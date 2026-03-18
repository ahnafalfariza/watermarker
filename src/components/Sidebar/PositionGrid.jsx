const POSITIONS = [
  ['top-left', 'top-center', 'top-right'],
  ['center-left', 'center', 'center-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
]

export default function PositionGrid({ watermark, onChange }) {
  return (
    <div className="control-group">
      <label className="control-label">Position</label>

      <div className="position-row">
        <div
          className={`position-grid ${watermark.tiled ? 'position-grid-disabled' : ''}`}
          role="radiogroup"
          aria-label="Watermark position"
        >
          {POSITIONS.map((row, ri) =>
            row.map((pos) => (
              <button
                key={pos}
                className={`position-cell ${watermark.position === pos && !watermark.tiled ? 'position-cell-active' : ''}`}
                onClick={() => !watermark.tiled && onChange('position', pos)}
                disabled={watermark.tiled}
                role="radio"
                aria-checked={watermark.position === pos && !watermark.tiled}
                aria-label={pos.replace('-', ' ')}
              />
            ))
          )}
        </div>

        <label className="toggle-label">
          <span className="toggle-text">Tiled</span>
          <button
            className={`toggle ${watermark.tiled ? 'toggle-on' : ''}`}
            onClick={() => onChange('tiled', !watermark.tiled)}
            role="switch"
            aria-checked={watermark.tiled}
            aria-label="Tiled watermark mode"
          >
            <span className="toggle-thumb" />
          </button>
        </label>
      </div>

      {watermark.tiled && (
        <div className="tiled-controls">
          <div className="control-group">
            <label className="control-label">
              Angle
              <span className="control-value">{watermark.tiledAngle}&deg;</span>
            </label>
            <input
              type="range"
              className="slider"
              min="-90"
              max="90"
              value={watermark.tiledAngle}
              onChange={(e) => onChange('tiledAngle', Number(e.target.value))}
              aria-label={`Tiled angle: ${watermark.tiledAngle} degrees`}
            />
          </div>
          <div className="control-group">
            <label className="control-label">
              Spacing
              <span className="control-value">{watermark.tiledSpacing}px</span>
            </label>
            <input
              type="range"
              className="slider"
              min="80"
              max="500"
              value={watermark.tiledSpacing}
              onChange={(e) => onChange('tiledSpacing', Number(e.target.value))}
              aria-label={`Tiled spacing: ${watermark.tiledSpacing}px`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
