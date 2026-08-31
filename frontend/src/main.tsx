import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary'
import { initPerfObserver, startMetricsReporting } from './utils/perfMetrics'

// Auto-reload on Vite dynamic import failure (e.g. after code update or stale chunk)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// Initialize Core Web Vitals observer (LCP, INP, CLS, FCP, TTFB)
try {
  initPerfObserver();
} catch (e) {
  console.warn('Perf observer init error:', e);
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
try {
  startMetricsReporting(API_BASE);
} catch (e) {
  console.warn('Metrics reporting init error:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
      <Analytics />
    </RootErrorBoundary>
  </StrictMode>,
)
