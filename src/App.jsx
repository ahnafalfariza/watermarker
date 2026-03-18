import { useState, useCallback } from 'react'
import DropZone from './components/DropZone.jsx'
import Editor from './components/Editor.jsx'
import Toast from './components/Toast.jsx'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILES = 50
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

function App() {
  const [files, setFiles] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [toasts, setToasts] = useState([])
  const [watermark, setWatermark] = useState({
    text: '',
    font: 'Satoshi',
    size: 48,
    opacity: 50,
    color: '#FFFFFF',
    position: 'center',
    tiled: false,
    tiledAngle: -30,
    tiledSpacing: 200,
  })

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      return next.slice(-3) // max 3 toasts
    })
    if (type !== 'error') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)

    if (fileArray.length > MAX_FILES) {
      addToast(`Maximum ${MAX_FILES} files allowed.`, 'error')
      return
    }

    const errors = []
    const valid = []

    for (const file of fileArray) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported format. Try JPG, PNG, WebP, or PDF.`)
        continue
      }
      if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
        errors.push(`${file.name} is too large (${sizeMB}MB). Maximum file size is 50MB.`)
        continue
      }
      if (file.size === 0) {
        errors.push(`${file.name}: File appears empty or corrupt.`)
        continue
      }
      valid.push(file)
    }

    errors.forEach(msg => addToast(msg, 'error'))

    if (valid.length > 0) {
      setFiles(valid)
      setActiveIndex(0)
    }
  }, [addToast])

  const handleStartOver = useCallback(() => {
    setFiles([])
    setActiveIndex(0)
  }, [])

  return (
    <>
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} />
      ) : (
        <Editor
          files={files}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          watermark={watermark}
          onWatermarkChange={setWatermark}
          onStartOver={handleStartOver}
          addToast={addToast}
        />
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default App
