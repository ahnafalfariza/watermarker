const STORAGE_KEY = 'watermark-templates'
const MAX_TEMPLATES = 20

/**
 * Get all saved templates.
 */
export function getTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save a template. Evicts oldest if at capacity.
 * Returns { success, evicted } where evicted is the name of the removed template, if any.
 */
export function saveTemplate(name, config) {
  const templates = getTemplates()
  let evicted = null

  // Remove existing template with same name
  const filtered = templates.filter(t => t.name !== name)

  if (filtered.length >= MAX_TEMPLATES) {
    evicted = filtered[0].name
    filtered.shift()
  }

  filtered.push({
    name,
    config,
    createdAt: Date.now(),
  })

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch {
    // LocalStorage full — try evicting one more
    if (filtered.length > 1) {
      evicted = filtered[0].name
      filtered.shift()
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      } catch {
        return { success: false, evicted: null }
      }
    } else {
      return { success: false, evicted: null }
    }
  }

  return { success: true, evicted }
}

/**
 * Delete a template by name.
 */
export function deleteTemplate(name) {
  const templates = getTemplates()
  const filtered = templates.filter(t => t.name !== name)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Load a template's config by name.
 */
export function loadTemplate(name) {
  const templates = getTemplates()
  const template = templates.find(t => t.name === name)
  return template ? template.config : null
}
