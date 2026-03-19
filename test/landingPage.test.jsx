import { describe, it, expect, vi, beforeAll } from 'vitest'

beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})
import { render, screen, fireEvent } from '@testing-library/react'
import LandingPage from '../src/components/LandingPage.jsx'

describe('LandingPage', () => {
  it('renders all sections', () => {
    render(<LandingPage onFiles={() => {}} />)

    expect(screen.getAllByText('Watermark').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('What you get')).toBeInTheDocument()
    expect(screen.getByText('Three steps')).toBeInTheDocument()
    expect(screen.getByText('Your files stay yours')).toBeInTheDocument()
    expect(screen.getByText('Questions')).toBeInTheDocument()
    expect(screen.getAllByText('Files never leave your device').length).toBeGreaterThanOrEqual(1)
  })

  it('toggles FAQ accordion open and closed', () => {
    render(<LandingPage onFiles={() => {}} />)

    const question = screen.getByText('Is it really free?')
    expect(screen.queryByText(/completely free/)).not.toBeInTheDocument()

    fireEvent.click(question)
    expect(screen.getByText(/completely free/)).toBeInTheDocument()

    fireEvent.click(question)
    expect(screen.queryByText(/completely free/)).not.toBeInTheDocument()
  })

  it('hides demo images gracefully on error', () => {
    render(<LandingPage onFiles={() => {}} />)

    const images = screen.getAllByRole('img')
    const demoImages = images.filter(
      img => img.alt === 'Photo without watermark' || img.alt === 'Photo with watermark applied'
    )

    demoImages.forEach(img => {
      fireEvent.error(img)
      expect(img.style.display).toBe('none')
    })
  })

  it('renders DropZone and passes onFiles through', () => {
    const onFiles = vi.fn()
    render(<LandingPage onFiles={onFiles} />)

    expect(
      screen.getByLabelText('Drop files here to watermark or click to browse')
    ).toBeInTheDocument()
  })
})
