import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(process.cwd(), 'dist')

describe('SEO build output', () => {
  const indexHtml = (() => {
    const path = join(distDir, 'index.html')
    if (!existsSync(path)) return null
    return readFileSync(path, 'utf-8')
  })()

  it.skipIf(!indexHtml)('pre-rendered HTML contains landing page content', () => {
    expect(indexHtml).toContain('What you get')
    expect(indexHtml).toContain('Three steps')
    expect(indexHtml).toContain('Your files stay yours')
    expect(indexHtml).toContain('Questions')
    expect(indexHtml).toContain('Drop files here')
  })

  it.skipIf(!indexHtml)('has optimized title tag', () => {
    expect(indexHtml).toContain('<title>Watermark — Free Online Image & PDF Watermarking Tool</title>')
  })

  it.skipIf(!indexHtml)('has canonical URL', () => {
    expect(indexHtml).toContain('<link rel="canonical"')
  })

  it.skipIf(!indexHtml)('has JSON-LD structured data', () => {
    expect(indexHtml).toContain('application/ld+json')
    expect(indexHtml).toContain('"FAQPage"')
    expect(indexHtml).toContain('"WebApplication"')
  })

  it.skipIf(!indexHtml)('has semantic landmarks', () => {
    expect(indexHtml).toContain('<main>')
    expect(indexHtml).toContain('<nav ')
  })

  it.skipIf(!indexHtml)('has font preload hints', () => {
    expect(indexHtml).toContain('rel="preload"')
    expect(indexHtml).toContain('preconnect')
  })

  it.skipIf(!indexHtml)('does not ship prerender chunk to client', () => {
    expect(indexHtml).not.toContain('prerender')
  })

  it('robots.txt exists', () => {
    expect(existsSync(join(distDir, 'robots.txt'))).toBe(true)
  })

  it('sitemap.xml exists', () => {
    expect(existsSync(join(distDir, 'sitemap.xml'))).toBe(true)
  })

  it.skipIf(!indexHtml)('JSON-LD is valid JSON', () => {
    const match = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    expect(match).not.toBeNull()
    expect(() => JSON.parse(match[1])).not.toThrow()
  })
})
