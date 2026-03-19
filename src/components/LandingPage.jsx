import { useState, useEffect, useRef, useCallback } from 'react'
import DropZone from './DropZone.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const FAQ_ITEMS = [
  {
    q: 'Is it really free?',
    a: 'Yes, completely free with no limits. No accounts, no subscriptions, no watermarks on your watermarks.',
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. Everything runs in your browser. Your files never leave your device — not even temporarily.',
  },
  {
    q: 'What file types are supported?',
    a: 'JPG, PNG, WebP images and PDF documents. You can batch process up to 50 files at once, up to 50MB each.',
  },
  {
    q: 'Can I use my company logo as a watermark?',
    a: 'Yes. Switch to Image mode in the editor and upload any PNG, SVG, or WebP logo. Adjust size, opacity, and position just like text watermarks.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. After your first visit, the app is cached and works without an internet connection. It\'s a Progressive Web App you can install on your device.',
  },
  {
    q: 'How is this different from other watermark tools?',
    a: 'Most watermark tools upload your files to their servers. This one doesn\'t. Your files stay on your device, processing happens in your browser, and there\'s nothing to sign up for.',
  },
]

export default function LandingPage({ onFiles }) {
  const [openFaq, setOpenFaq] = useState(null)
  const [showFloatingCta, setShowFloatingCta] = useState(false)
  const dropZoneRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    const target = dropZoneRef.current
    if (!target) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingCta(!entry.isIntersecting)
      },
      { threshold: 0 }
    )
    observerRef.current.observe(target)

    return () => observerRef.current?.disconnect()
  }, [])

  const scrollToDropZone = useCallback(() => {
    dropZoneRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toggleFaq = useCallback((index) => {
    setOpenFaq(prev => prev === index ? null : index)
  }, [])

  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <nav className="header-nav">
          <h1 className="header-title">Watermark</h1>
          <div className="header-actions">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main>

      {/* Hero: Drop Zone */}
      <section className="landing-hero">
        <div className="landing-container" ref={dropZoneRef}>
          <DropZone onFiles={onFiles} />
          <div className="privacy-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Files never leave your device
          </div>
        </div>
        <div className="scroll-indicator" onClick={scrollToDropZone} role="presentation">
          <span className="scroll-indicator-text">See what it does</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scroll-indicator-chevron">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="landing-h2">What you get</h2>

          <div className="demo-comparison">
            <div className="demo-side">
              <span className="demo-label">BEFORE</span>
              <img
                src="/demo/before.svg"
                alt="Photo without watermark"
                className="demo-image"
                width="480"
                height="320"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
            <div className="demo-side">
              <span className="demo-label">AFTER</span>
              <img
                src="/demo/after.svg"
                alt="Photo with watermark applied"
                className="demo-image"
                width="480"
                height="320"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          </div>

          <ul className="feature-list">
            <li className="feature-item">
              <span className="feature-bullet">&middot;</span>
              <span><strong>Text or image watermarks</strong> — use your brand, logo, or any text with full control over font, size, color, and opacity</span>
            </li>
            <li className="feature-item">
              <span className="feature-bullet">&middot;</span>
              <span><strong>Batch processing</strong> — watermark up to 50 files at once and download as a ZIP</span>
            </li>
            <li className="feature-item">
              <span className="feature-bullet">&middot;</span>
              <span><strong>PDF support</strong> — watermark multi-page PDFs, not just images</span>
            </li>
            <li className="feature-item">
              <span className="feature-bullet">&middot;</span>
              <span><strong>Tiled mode</strong> — repeat watermarks diagonally across the entire surface for full coverage</span>
            </li>
          </ul>

          <button className="landing-cta" onClick={scrollToTop}>
            Try it now
            <span className="landing-cta-arrow">&rarr;</span>
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2">Three steps</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">01</span>
              <div className="step-content">
                <h3 className="step-title">Drop your files</h3>
                <p className="step-desc">Drag images or PDFs onto the drop zone. Up to 50 files, 50MB each.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">02</span>
              <div className="step-content">
                <h3 className="step-title">Configure your watermark</h3>
                <p className="step-desc">Choose text or logo, adjust position, size, opacity, and tiling. Preview updates live.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">03</span>
              <div className="step-content">
                <h3 className="step-title">Download</h3>
                <p className="step-desc">Export individual files or batch download everything as a ZIP.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy / Trust */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="landing-h2">Your files stay yours</h2>
          <div className="trust-points">
            <div className="trust-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <h3 className="trust-title">100% client-side</h3>
                <p className="trust-desc">All processing happens in your browser. No server, no upload, no cloud.</p>
              </div>
            </div>
            <div className="trust-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div>
                <h3 className="trust-title">Open source</h3>
                <p className="trust-desc">Read the code yourself. No tracking, no analytics, no hidden requests.</p>
              </div>
            </div>
            <div className="trust-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div>
                <h3 className="trust-title">Works offline</h3>
                <p className="trust-desc">Install it as a PWA. Once loaded, no internet required.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2">Questions</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'faq-item-open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="faq-chevron"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">{item.a}</div>
                )}
              </div>
            ))}
          </div>
          <button className="landing-cta" onClick={scrollToTop}>
            Try it now
            <span className="landing-cta-arrow">&rarr;</span>
          </button>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="landing-footer-brand">Watermark</span>
        <span className="landing-footer-note">Files never leave your device</span>
      </footer>

      {/* Floating CTA */}
      <button
        className={`floating-cta ${showFloatingCta ? 'floating-cta-visible' : ''}`}
        onClick={scrollToTop}
        aria-hidden={!showFloatingCta}
        tabIndex={showFloatingCta ? 0 : -1}
      >
        Try it now
      </button>
    </div>
  )
}
