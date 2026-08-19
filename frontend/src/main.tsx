import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPerfObserver, startMetricsReporting } from './utils/perfMetrics'

// Initialize Core Web Vitals observer (LCP, INP, CLS, FCP, TTFB)
initPerfObserver();

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
startMetricsReporting(API_BASE);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
