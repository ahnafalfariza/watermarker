import { useState, useEffect, useCallback } from 'react'
import { getTemplates, saveTemplate, deleteTemplate, loadTemplate } from '../../lib/templateManager.js'
import { loadLogoImage } from '../../lib/watermarkRenderer.js'
import { encodeTemplateUrl } from '../../lib/urlTemplate.js'

export default function TemplatePanel({ watermark, onLoad, addToast }) {
  const [templates, setTemplates] = useState([])
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    setTemplates(getTemplates())
  }, [])

  const handleSave = useCallback(() => {
    if (!newName.trim()) return

    const { logoElement, ...config } = watermark
    const result = saveTemplate(newName.trim(), config)

    if (result.success) {
      if (result.evicted) {
        addToast(`Storage full — removed oldest template "${result.evicted}".`, 'warning')
      }
      addToast(`Template "${newName.trim()}" saved.`, 'success')
      setTemplates(getTemplates())
      setNewName('')
      setSaving(false)
    } else {
      addToast('Could not save template — storage full.', 'error')
    }
  }, [newName, watermark, addToast])

  const handleLoad = useCallback(async (name) => {
    const config = loadTemplate(name)
    if (config) {
      // Reconstruct logoElement from saved dataUri if present
      if (config.logoDataUri) {
        try {
          config.logoElement = await loadLogoImage(config.logoDataUri)
        } catch {
          config.logoElement = null
        }
      }
      onLoad(prev => ({ ...prev, ...config }))
      addToast(`Template "${name}" loaded.`, 'success')
    }
  }, [onLoad, addToast])

  const handleDelete = useCallback((name) => {
    deleteTemplate(name)
    setTemplates(getTemplates())
  }, [])

  const handleCopyLink = useCallback(() => {
    const url = encodeTemplateUrl(watermark)
    if (!url) {
      addToast('Nothing to share — using default settings.', 'info')
      return
    }
    navigator.clipboard.writeText(url).then(
      () => addToast('Template link copied to clipboard.', 'success'),
      () => addToast('Could not copy link.', 'error')
    )
  }, [watermark, addToast])

  return (
    <div className="control-group">
      <label className="control-label">Templates</label>
      <div className="template-chips">
        {templates.map(t => (
          <div key={t.name} className="template-chip">
            <button
              className="template-chip-name"
              onClick={() => handleLoad(t.name)}
              title={`Load "${t.name}"`}
            >
              {t.name}
            </button>
            <button
              className="template-chip-delete"
              onClick={() => handleDelete(t.name)}
              aria-label={`Delete template ${t.name}`}
            >
              &times;
            </button>
          </div>
        ))}

        {saving ? (
          <div className="template-save-form">
            <input
              type="text"
              className="input input-sm"
              placeholder="Template name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSaving(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <button
              className="template-chip template-chip-add"
              onClick={() => setSaving(true)}
            >
              + Save
            </button>
            <button
              className="template-chip template-chip-link"
              onClick={handleCopyLink}
              title="Copy shareable link with current settings"
            >
              Copy link
            </button>
          </>
        )}
      </div>
    </div>
  )
}
