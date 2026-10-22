import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
// Watermark fonts not served by the CDN stylesheets in index.html
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/caveat/latin-700.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
