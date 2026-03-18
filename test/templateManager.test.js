import { describe, it, expect, beforeEach } from 'vitest'
import { getTemplates, saveTemplate, deleteTemplate, loadTemplate } from '../src/lib/templateManager.js'

beforeEach(() => {
  localStorage.clear()
})

describe('templateManager', () => {
  const sampleConfig = { text: 'SAMPLE', font: 'Satoshi', size: 48 }

  it('returns empty array when no templates saved', () => {
    expect(getTemplates()).toEqual([])
  })

  it('saves and loads a template', () => {
    saveTemplate('My Template', sampleConfig)
    const loaded = loadTemplate('My Template')
    expect(loaded).toEqual(sampleConfig)
  })

  it('returns null for non-existent template', () => {
    expect(loadTemplate('nope')).toBeNull()
  })

  it('deletes a template', () => {
    saveTemplate('A', sampleConfig)
    saveTemplate('B', sampleConfig)
    deleteTemplate('A')
    expect(loadTemplate('A')).toBeNull()
    expect(loadTemplate('B')).toEqual(sampleConfig)
  })

  it('overwrites template with same name', () => {
    saveTemplate('T', { text: 'old' })
    saveTemplate('T', { text: 'new' })
    expect(loadTemplate('T')).toEqual({ text: 'new' })
    expect(getTemplates()).toHaveLength(1)
  })

  it('evicts oldest when at capacity (20)', () => {
    for (let i = 0; i < 20; i++) {
      saveTemplate(`t${i}`, { n: i })
    }
    const result = saveTemplate('overflow', { n: 99 })
    expect(result.evicted).toBe('t0')
    expect(result.success).toBe(true)
    expect(loadTemplate('t0')).toBeNull()
    expect(loadTemplate('overflow')).toEqual({ n: 99 })
  })
})
