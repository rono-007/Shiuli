/**
 * PujoPoth Frontend Performance Metrics — Phase 1: Observability Only
 * ===================================================================
 * Lightweight client-side performance instrumentation:
 * - Core Web Vitals (LCP, INP, CLS, FCP, TTFB) via PerformanceObserver
 * - API request timing wrapper
 * - Feature load tracking
 * - Batched reporting to backend
 *
 * Does NOT modify any existing behavior or slow down the UI.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebVitals {
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface ApiRequestMetric {
  endpoint: string;
  method: string;
  status?: number;
  total_ms: number;
  ttfb_ms?: number;
  download_ms?: number;
  parse_ms?: number;
  response_bytes?: number;
  success: boolean;
  timestamp: string;
}

interface FeatureLoadMetric {
  feature: string;
  shell_ms?: number;
  data_wait_ms?: number;
  render_ms?: number;
  total_ms: number;
  timestamp: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const webVitals: WebVitals = {};
const apiRequests: ApiRequestMetric[] = [];
const featureLoads: FeatureLoadMetric[] = [];
const MAX_API_REQUESTS = 100;
const MAX_FEATURE_LOADS = 50;

let reportingInterval: ReturnType<typeof setInterval> | null = null;

// ─── Core Web Vitals Observer ─────────────────────────────────────────────────

export function initPerfObserver(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // LCP - Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (last) {
        webVitals.lcp = Math.round(last.startTime);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { /* unsupported */ }

  // FCP - First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          webVitals.fcp = Math.round(entry.startTime);
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) { /* unsupported */ }

  // CLS - Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          webVitals.cls = Math.round(clsValue * 1000) / 1000;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) { /* unsupported */ }

  // INP - Interaction to Next Paint
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        const duration = entry.duration;
        if (!webVitals.inp || duration > webVitals.inp) {
          webVitals.inp = Math.round(duration);
        }
      }
    });
    inpObserver.observe({ type: 'event', buffered: true });
  } catch (e) { /* unsupported */ }

  // TTFB - Time to First Byte (from navigation timing)
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      webVitals.ttfb = Math.round(nav.responseStart - nav.requestStart);
    }
  } catch (e) { /* unsupported */ }
}

// ─── API Request Tracking ─────────────────────────────────────────────────────

/**
 * Wraps a fetch call to measure timing breakdown.
 * Returns the same Response — does NOT modify behavior.
 */
export async function trackApiRequest(
  endpoint: string,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  const t0 = performance.now();
  let status: number | undefined;
  let success = false;
  let responseBytes: number | undefined;
  let ttfb_ms: number | undefined;

  try {
    const response = await fetchFn();
    ttfb_ms = Math.round(performance.now() - t0);
    status = response.status;
    success = response.ok;

    // Try to get response size from Content-Length header
    const cl = response.headers.get('content-length');
    if (cl) responseBytes = parseInt(cl, 10);

    const total_ms = Math.round(performance.now() - t0);

    // Record
    if (apiRequests.length >= MAX_API_REQUESTS) {
      apiRequests.shift();
    }
    apiRequests.push({
      endpoint,
      method: 'GET',
      status,
      total_ms,
      ttfb_ms,
      download_ms: total_ms - (ttfb_ms || 0),
      response_bytes: responseBytes,
      success,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (err) {
    const total_ms = Math.round(performance.now() - t0);
    if (apiRequests.length >= MAX_API_REQUESTS) {
      apiRequests.shift();
    }
    apiRequests.push({
      endpoint,
      method: 'GET',
      status,
      total_ms,
      success: false,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
}

// ─── Feature Load Tracking ────────────────────────────────────────────────────

interface FeatureTracker {
  markShellReady: () => void;
  markDataReady: () => void;
  markContentUsable: () => void;
}

/**
 * Creates a tracker for measuring feature/page load stages.
 */
export function trackFeatureLoad(featureName: string): FeatureTracker {
  const t0 = performance.now();
  let shellTime: number | undefined;
  let dataTime: number | undefined;

  return {
    markShellReady() {
      shellTime = performance.now() - t0;
    },
    markDataReady() {
      dataTime = performance.now() - t0;
    },
    markContentUsable() {
      const total = performance.now() - t0;
      if (featureLoads.length >= MAX_FEATURE_LOADS) {
        featureLoads.shift();
      }
      featureLoads.push({
        feature: featureName,
        shell_ms: shellTime ? Math.round(shellTime) : undefined,
        data_wait_ms: dataTime ? Math.round(dataTime) : undefined,
        render_ms: dataTime ? Math.round(total - dataTime) : undefined,
        total_ms: Math.round(total),
        timestamp: new Date().toISOString(),
      });
    },
  };
}

// ─── Reporting ────────────────────────────────────────────────────────────────

/**
 * Start periodic reporting of client metrics to the backend.
 * Only sends if there are new metrics to report.
 */
export function startMetricsReporting(baseUrl: string): void {
  if (reportingInterval) return;

  reportingInterval = setInterval(async () => {
    // Only send if we have data
    if (
      apiRequests.length === 0 &&
      featureLoads.length === 0 &&
      Object.keys(webVitals).length === 0
    ) {
      return;
    }

    try {
      await fetch(`${baseUrl}/admin/metrics/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          web_vitals: { ...webVitals },
          api_requests: [...apiRequests],
          feature_loads: [...featureLoads],
          user_agent: navigator.userAgent,
          page_url: window.location.href,
        }),
      });
      // Clear queues after successful send
      apiRequests.length = 0;
      featureLoads.length = 0;
    } catch (e) {
      // Silently fail — metrics should never disrupt the user
    }
  }, 30000); // Every 30 seconds
}

/**
 * Get all collected client metrics (for admin dashboard display).
 */
export function getClientMetrics(): {
  web_vitals: WebVitals;
  api_requests: ApiRequestMetric[];
  feature_loads: FeatureLoadMetric[];
} {
  return {
    web_vitals: { ...webVitals },
    api_requests: [...apiRequests],
    feature_loads: [...featureLoads],
  };
}
