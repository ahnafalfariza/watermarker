// The edge build avoids react-dom/server.browser, which opens a MessageChannel
// at import time and keeps the Node build process from exiting.
import { renderToString } from 'react-dom/server.edge'
import App from './App.jsx'

export async function prerender() {
  const html = renderToString(<App />)

  return {
    html,
    head: {
      lang: 'en',
    },
  }
}
