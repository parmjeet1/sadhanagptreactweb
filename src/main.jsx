import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// PWA: register the service worker unconditionally (existing call sites
// elsewhere in the app also register '/sw.js', but only as part of the
// push-notification opt-in flow, gated on `'PushManager' in window`). This
// registration is what makes the app installable/offline-capable even when
// push isn't available or hasn't been enabled yet. Registering the same
// scriptURL/scope twice is a no-op in browsers, so this can't conflict with
// those other registrations.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}
