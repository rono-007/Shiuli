import { useState, useEffect, useCallback, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { 
  Shield, Activity, Database, ScrollText, ChevronLeft, 
  RefreshCw, Clock, AlertTriangle, Globe, Zap, Server,
  HardDrive, Users, TrendingUp, Search, X, Eye, ChevronDown,
  ChevronUp, BarChart3, Wifi, WifiOff, Smartphone, Monitor,
  Tablet, Bot, MapPin, ArrowUpRight, Filter, AlertOctagon,
  Gauge, ArrowRight
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminPanel Render Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-[#111827] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Admin Panel Error</h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-left overflow-x-auto">
              {this.state.error?.message || 'Unknown rendering error'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface IPInfo {
  ip: string;
  count: number;
  pct: number;
  last_seen: string;
  country: string;
}

interface RefererInfo {
  domain: string;
  count: number;
  pct: number;
}

interface TimeSeriesPoint {
  time: string;
  requests: number;
  errors: number;
  avg_ms: number;
}

interface RecentError {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  ip: string;
}

interface Stats {
  total: number;
  errors: number;
  error_rate: number;
  avg_ms: number;
  p95_ms: number;
  max_ms: number;
  min_ms: number;
  unique_ips: number;
  req_per_min: number;
  uptime_seconds: number;
  status_breakdown: Record<string, number>;
  method_breakdown: Record<string, number>;
  device_breakdown: { Desktop: number; Mobile: number; Tablet: number; Bot: number };
  ip_breakdown: IPInfo[];
  referer_breakdown: RefererInfo[];
  country_breakdown: Record<string, number>;
  latency_buckets: Record<string, number>;
  time_series: TimeSeriesPoint[];
  top_endpoints: { endpoint: string; count: number }[];
  slowest_endpoints: { endpoint: string; avg_ms: number }[];
  browser_breakdown: Record<string, number>;
  recent_errors: RecentError[];
  total_response_bytes: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  query: string;
  status: number;
  duration_ms: number;
  ip: string;
  user_agent: string;
  referer: string;
  content_type: string;
  accept_language: string;
  host: string;
  origin: string;
  country?: string;
  response_size: number;
}

interface DataCollection {
  name: string;
  file: string;
  endpoint: string;
  count: number;
  file_size_bytes: number;
  error?: string;
}

interface DataOverview {
  collections: DataCollection[];
  total_items: number;
  total_size_bytes: number;
  server_start: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function statusColor(status: number): string {
  if (status < 300) return 'text-emerald-400';
  if (status < 400) return 'text-amber-400';
  if (status < 500) return 'text-orange-400';
  return 'text-red-400';
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    case 'POST': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'PUT': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'DELETE': return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

// ─── API Fetch Helper ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';

async function adminFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-admin-token': token },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await adminFetch('/admin/stats', token.trim());
      onLogin(token.trim());
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setError('Invalid admin token');
      } else {
        setError('Cannot reach server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 mb-4">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-sans">PujoPoth Admin</h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">Enter your admin token to access real-time analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin Token"
              className="w-full px-4 py-3 bg-[#111827] border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans text-sm"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-sans bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-sans text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'text-amber-400' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-sans font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white font-sans tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1 font-sans">{sub}</div>}
    </div>
  );
}

// ─── Time Series Chart ────────────────────────────────────────────────────────

function TrafficChart({ data }: { data: TimeSeriesPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-600">
        No time-series data yet (waiting for incoming traffic...)
      </div>
    );
  }

  const maxRequests = Math.max(...data.map(d => d.requests), 1);
  const height = 140;
  const width = 600;
  const padding = 24;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.requests / maxRequests) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-slate-400 font-medium">Real-Time Traffic Volume (5-Min Windows)</span>
        <span className="text-amber-400 font-mono text-[11px]">Peak: {maxRequests} reqs</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - padding * 2);
          const val = Math.round(ratio * maxRequests);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding - 6} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-600 font-mono">{val}</text>
            </g>
          );
        })}

        {/* Area & Line */}
        <path d={areaD} fill="url(#trafficGradient)" />
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} className="group">
            <circle cx={p.x} cy={p.y} r="4" className="fill-amber-400 stroke-[#0a0e17] stroke-2 group-hover:r-6 transition-all" />
            {p.errors > 0 && (
              <circle cx={p.x} cy={p.y} r="7" className="fill-red-500/30 stroke-red-400 stroke-1 animate-ping" />
            )}
            <text x={p.x} y={height - 6} textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">{p.time}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Log Detail Modal ─────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const fields = [
    { label: 'Request ID', value: log.id },
    { label: 'Timestamp', value: new Date(log.timestamp).toLocaleString() },
    { label: 'Method', value: log.method },
    { label: 'Path', value: log.path },
    { label: 'Query', value: log.query || '—' },
    { label: 'Status', value: String(log.status) },
    { label: 'Duration', value: `${log.duration_ms} ms` },
    { label: 'Client IP (Origin)', value: log.ip },
    { label: 'Country', value: log.country || 'Unknown' },
    { label: 'User-Agent', value: log.user_agent || '—' },
    { label: 'Referer', value: log.referer || '—' },
    { label: 'Host', value: log.host || '—' },
    { label: 'Origin', value: log.origin || '—' },
    { label: 'Accept-Language', value: log.accept_language || '—' },
    { label: 'Response Size', value: formatBytes(log.response_size) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40 sticky top-0 bg-[#111827] z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${methodColor(log.method)}`}>{log.method}</span>
            <h3 className="text-white font-sans font-semibold text-sm truncate">{log.path}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex flex-col gap-0.5 border-b border-slate-800/40 pb-2 last:border-0">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans">{f.label}</span>
              <span className="text-xs text-slate-200 font-mono break-all">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

type Tab = 'overview' | 'sources' | 'logs' | 'data';

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [dataOverview, setDataOverview] = useState<DataOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [serverOnline, setServerOnline] = useState(true);

  // Logs tab state
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logMethodFilter, setLogMethodFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logSortField, setLogSortField] = useState<'timestamp' | 'duration_ms' | 'status'>('timestamp');
  const [logSortDir, setLogSortDir] = useState<'asc' | 'desc'>('desc');

  // Data tab state
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<Record<string, unknown[]>>({});
  const [collectionSearch, setCollectionSearch] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, logsData, overviewData, healthData] = await Promise.allSettled([
        adminFetch<Stats>('/admin/stats', token),
        adminFetch<{ logs: LogEntry[]; total: number }>('/admin/logs?limit=500', token),
        adminFetch<DataOverview>('/admin/data-overview', token),
        fetch(`${API_BASE}/health`).then(r => r.json()),
      ]);

      if (statsData.status === 'fulfilled') {
        const val = statsData.value;
        setStats({
          ...val,
          ip_breakdown: val.ip_breakdown || [],
          referer_breakdown: val.referer_breakdown || [],
          device_breakdown: val.device_breakdown || { Desktop: 0, Mobile: 0, Tablet: 0, Bot: 0 },
          country_breakdown: val.country_breakdown || {},
          latency_buckets: val.latency_buckets || {},
          method_breakdown: val.method_breakdown || {},
          status_breakdown: val.status_breakdown || {},
          browser_breakdown: val.browser_breakdown || {},
          top_endpoints: val.top_endpoints || [],
          slowest_endpoints: val.slowest_endpoints || [],
          time_series: val.time_series || [],
          recent_errors: val.recent_errors || [],
        });
      }
      if (logsData.status === 'fulfilled') {
        setLogs(logsData.value.logs);
        setLogsTotal(logsData.value.total);
      }
      if (overviewData.status === 'fulfilled') setDataOverview(overviewData.value);
      if (healthData.status === 'fulfilled') {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
      setLastRefresh(new Date());
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Fetch collection data when expanded
  const loadCollectionData = async (endpoint: string) => {
    if (collectionData[endpoint]) return;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const data = await res.json();
      setCollectionData(prev => ({ ...prev, [endpoint]: data }));
    } catch {
      // silently fail
    }
  };

  // Filter and sort logs
  const filteredLogs = logs
    .filter(log => {
      if (logSearch) {
        const s = logSearch.toLowerCase();
        if (!log.path.toLowerCase().includes(s) && !log.ip.includes(s) && !log.id.includes(s)) return false;
      }
      if (logStatusFilter !== 'all') {
        const bucket = `${Math.floor(log.status / 100)}xx`;
        if (bucket !== logStatusFilter) return false;
      }
      if (logMethodFilter !== 'all' && log.method !== logMethodFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = logSortDir === 'asc' ? 1 : -1;
      if (logSortField === 'timestamp') return dir * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (logSortField === 'duration_ms') return dir * (a.duration_ms - b.duration_ms);
      return dir * (a.status - b.status);
    });

  // Derived metrics from logs (fallback for backends deployed prior to main.py update)
  const effectiveIPBreakdown: IPInfo[] = (stats?.ip_breakdown && stats.ip_breakdown.length > 0)
    ? stats.ip_breakdown
    : (() => {
        if (!logs || logs.length === 0) return [];
        const counts: Record<string, { count: number; last_seen: string; country: string }> = {};
        for (const l of logs) {
          if (!counts[l.ip]) {
            counts[l.ip] = { count: 0, last_seen: l.timestamp, country: l.country || 'Unknown' };
          }
          counts[l.ip].count += 1;
        }
        const total = logs.length;
        return Object.entries(counts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([ip, data]) => ({
            ip,
            count: data.count,
            pct: Math.round((data.count / total) * 100),
            last_seen: data.last_seen,
            country: data.country,
          }));
      })();

  const effectiveRefererBreakdown: RefererInfo[] = (stats?.referer_breakdown && stats.referer_breakdown.length > 0)
    ? stats.referer_breakdown
    : (() => {
        if (!logs || logs.length === 0) return [];
        const counts: Record<string, number> = {};
        for (const l of logs) {
          let domain = 'Direct / Bookmark / App';
          if (l.referer) {
            try { domain = l.referer.split('//').pop()?.split('/')[0] || l.referer; } catch { domain = l.referer.slice(0, 30); }
          }
          counts[domain] = (counts[domain] || 0) + 1;
        }
        const total = logs.length;
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([domain, count]) => ({
            domain,
            count,
            pct: Math.round((count / total) * 100),
          }));
      })();

  const effectiveLatencyBuckets: Record<string, number> = (stats?.latency_buckets && Object.keys(stats.latency_buckets).length > 0)
    ? stats.latency_buckets
    : (() => {
        const buckets: Record<string, number> = { '<50ms': 0, '50-150ms': 0, '150-300ms': 0, '300-500ms': 0, '>500ms': 0 };
        if (!logs) return buckets;
        for (const l of logs) {
          const d = l.duration_ms;
          if (d < 50) buckets['<50ms']++;
          else if (d < 150) buckets['50-150ms']++;
          else if (d < 300) buckets['150-300ms']++;
          else if (d < 500) buckets['300-500ms']++;
          else buckets['>500ms']++;
        }
        return buckets;
      })();

  const effectiveTimeSeries: TimeSeriesPoint[] = (stats?.time_series && stats.time_series.length > 0)
    ? stats.time_series
    : (() => {
        if (!logs || logs.length === 0) return [];
        const chronological = [...logs].reverse();
        const buckets: Record<string, { count: number; errors: number; durations: number[] }> = {};
        for (const l of chronological) {
          try {
            const dt = new Date(l.timestamp);
            const minBucket = Math.floor(dt.getMinutes() / 5) * 5;
            const key = `${String(dt.getHours()).padStart(2, '0')}:${String(minBucket).padStart(2, '0')}`;
            if (!buckets[key]) buckets[key] = { count: 0, errors: 0, durations: [] };
            buckets[key].count++;
            if (l.status >= 400) buckets[key].errors++;
            buckets[key].durations.push(l.duration_ms);
          } catch {
            // ignore
          }
        }
        return Object.entries(buckets).slice(-12).map(([time, data]) => ({
          time,
          requests: data.count,
          errors: data.errors,
          avg_ms: data.durations.length ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length) : 0,
        }));
      })();

  const effectiveDeviceBreakdown = (stats?.device_breakdown && (stats.device_breakdown.Desktop || stats.device_breakdown.Mobile || stats.device_breakdown.Tablet || stats.device_breakdown.Bot))
    ? stats.device_breakdown
    : (() => {
        const res = { Desktop: 0, Mobile: 0, Tablet: 0, Bot: 0 };
        if (!logs) return res;
        for (const l of logs) {
          const ua = (l.user_agent || '').toLowerCase();
          if (ua.includes('bot') || ua.includes('crawler') || ua.includes('python')) res.Bot++;
          else if (ua.includes('ipad') || ua.includes('tablet')) res.Tablet++;
          else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) res.Mobile++;
          else res.Desktop++;
        }
        return res;
      })();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
    { id: 'sources', label: 'Request Origins (IPs)', icon: MapPin },
    { id: 'logs', label: 'Request Logs', icon: ScrollText },
    { id: 'data', label: 'Data Explorer', icon: Database },
  ];

  const handleFilterByIP = (ip: string) => {
    setLogSearch(ip);
    setTab('logs');
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0a0e17]/90 backdrop-blur-xl border-b border-slate-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onLogout} className="p-1.5 text-slate-500 hover:text-white transition-colors" title="Back to Site">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-white font-semibold text-sm tracking-tight">PujoPoth Real-Time Admin</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${serverOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
              {serverOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {serverOnline ? 'Live Render Online' : 'Offline'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Auto-sync: 15s • {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-slate-700/40 bg-[#0a0e17]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${tab === t.id
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── OVERVIEW TAB ──────────────────────────────────────────── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Activity} label="Total Requests" value={stats.total.toLocaleString()} sub={`${stats.unique_ips} unique IPs`} />
              <StatCard icon={AlertTriangle} label="Error Rate" value={`${stats.error_rate}%`} sub={`${stats.errors} failed reqs`} color={stats.error_rate > 5 ? 'text-red-400' : 'text-emerald-400'} />
              <StatCard icon={Zap} label="Avg Latency" value={`${stats.avg_ms}ms`} sub={`P95: ${stats.p95_ms}ms`} />
              <StatCard icon={Users} label="Unique IPs" value={stats.unique_ips} sub="Distinct origin IPs" />
              <StatCard icon={TrendingUp} label="Req / Min" value={stats.req_per_min} sub="Last 5-min average" />
              <StatCard icon={Clock} label="Server Uptime" value={formatUptime(stats.uptime_seconds)} sub="Continuous runtime" />
            </div>

            {/* Real-time Traffic Time-Series Chart */}
            <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5 shadow-lg">
              <TrafficChart data={effectiveTimeSeries} />
            </div>

            {/* Request Sources & Origins Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Top Origin IPs */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Request Origin IPs
                  </h3>
                  <button onClick={() => setTab('sources')} className="text-[10px] text-amber-400 hover:underline flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {effectiveIPBreakdown.slice(0, 5).map((item) => (
                    <div key={item.ip} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                      <div>
                        <div className="text-xs font-mono text-white flex items-center gap-1.5">
                          {item.ip}
                          {item.country !== 'Unknown' && (
                            <span className="text-[9px] px-1 bg-slate-700 text-slate-300 rounded">{item.country}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.last_seen).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-400 font-mono tabular-nums">{item.count}</span>
                        <button onClick={() => handleFilterByIP(item.ip)} className="p-1 text-slate-500 hover:text-white" title="Filter logs by IP">
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {effectiveIPBreakdown.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">No origin IPs captured yet</p>
                  )}
                </div>
              </div>

              {/* Referer Domains */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" /> Traffic Sources (Referers)
                </h3>
                <div className="space-y-2">
                  {effectiveRefererBreakdown.map((ref) => (
                    <div key={ref.domain}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate max-w-[180px]">{ref.domain}</span>
                        <span className="text-slate-400 font-mono">{ref.count} ({ref.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${ref.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {effectiveRefererBreakdown.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">No referer data recorded</p>
                  )}
                </div>
              </div>

              {/* Latency Distribution Histogram */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Response Time Distribution
                </h3>
                <div className="space-y-2">
                  {Object.entries(effectiveLatencyBuckets).map(([bucket, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const color = bucket.includes('>500') ? 'bg-red-500' : bucket.includes('300') ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div key={bucket}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 font-mono">{bucket}</span>
                          <span className="text-slate-300 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Breakdown Row: Devices, Browsers, Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Devices */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" /> Device Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Mobile', icon: Smartphone, count: effectiveDeviceBreakdown.Mobile },
                    { label: 'Desktop', icon: Monitor, count: effectiveDeviceBreakdown.Desktop },
                    { label: 'Tablet', icon: Tablet, count: effectiveDeviceBreakdown.Tablet },
                    { label: 'Bot / Script', icon: Bot, count: effectiveDeviceBreakdown.Bot },
                  ].map(item => {
                    const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div key={item.label} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                          <item.icon className="w-3.5 h-3.5 text-slate-300" />
                          {item.label}
                        </div>
                        <div className="text-lg font-bold text-white font-mono">{item.count}</div>
                        <div className="text-[10px] text-slate-500">{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Codes */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Status Code Distribution
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.status_breakdown).sort().map(([bucket, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const barColor = bucket.startsWith('2') ? 'bg-emerald-500' : bucket.startsWith('3') ? 'bg-sky-500' : bucket.startsWith('4') ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={bucket}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-mono font-semibold">{bucket}</span>
                          <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Browsers */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> Browser Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.browser_breakdown).sort((a, b) => b[1] - a[1]).map(([browser, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={browser}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{browser}</span>
                          <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Top & Slowest Endpoints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Top Endpoints */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Most Requested Endpoints</h3>
                <div className="space-y-1">
                  {stats.top_endpoints.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/40">
                      <span className="text-xs text-slate-300 font-mono truncate flex-1">{ep.endpoint}</span>
                      <span className="text-xs text-amber-400 font-semibold ml-3 tabular-nums font-mono">{ep.count} reqs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slowest Endpoints */}
              <div className="bg-[#111827] border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Slowest Endpoints (Avg Latency)</h3>
                <div className="space-y-1">
                  {stats.slowest_endpoints.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/40">
                      <span className="text-xs text-slate-300 font-mono truncate flex-1">{ep.endpoint}</span>
                      <span className={`text-xs font-semibold ml-3 tabular-nums font-mono ${ep.avg_ms > 500 ? 'text-red-400' : ep.avg_ms > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>{ep.avg_ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Error Inspector */}
            {stats.recent_errors.length > 0 && (
              <div className="bg-[#111827] border border-red-500/30 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> Live Failed Requests (4xx / 5xx Errors)
                </h3>
                <div className="space-y-1.5">
                  {stats.recent_errors.map((err) => (
                    <div key={err.id} className="flex items-center justify-between py-2 px-3 bg-red-950/20 border border-red-500/20 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold">{err.status}</span>
                        <span className="text-slate-300 font-mono truncate">{err.path}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                        <span>{err.ip}</span>
                        <span className="text-red-400 font-semibold">{err.duration_ms}ms</span>
                        <span>{new Date(err.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── REQUEST ORIGINS (IPs) TAB ─────────────────────────────── */}
        {tab === 'sources' && stats && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">All Active Request Origins ({stats.ip_breakdown.length} Unique IPs)</h2>
              <span className="text-xs text-slate-500 font-mono">Real-time source tracking from server logs</span>
            </div>

            <div className="bg-[#111827] border border-slate-700/40 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/40 text-slate-500 uppercase tracking-wider">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">IP Address</th>
                      <th className="text-left py-3 px-4">Country</th>
                      <th className="text-left py-3 px-4">Total Requests</th>
                      <th className="text-left py-3 px-4">Share %</th>
                      <th className="text-left py-3 px-4">Last Active</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ip_breakdown.map((item, index) => (
                      <tr key={item.ip} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-mono">{index + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-white">{item.ip}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[10px] font-mono">
                            {item.country}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 tabular-nums">{item.count.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">{item.pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{new Date(item.last_seen).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleFilterByIP(item.ip)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-medium transition-all"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── LOGS TAB ──────────────────────────────────────────────── */}
        {tab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  placeholder="Search by path, IP, or request ID..."
                  className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-sans"
                />
                {logSearch && (
                  <button onClick={() => setLogSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={logStatusFilter}
                  onChange={e => setLogStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#111827] border border-slate-700/50 rounded-lg text-xs text-slate-300 font-sans focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="2xx">2xx Success</option>
                  <option value="3xx">3xx Redirect</option>
                  <option value="4xx">4xx Client Error</option>
                  <option value="5xx">5xx Server Error</option>
                </select>
                <select
                  value={logMethodFilter}
                  onChange={e => setLogMethodFilter(e.target.value)}
                  className="px-3 py-2 bg-[#111827] border border-slate-700/50 rounded-lg text-xs text-slate-300 font-sans focus:outline-none"
                >
                  <option value="all">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-sans">
                Showing {filteredLogs.length} of {logsTotal} logs
              </span>
              <div className="flex items-center gap-1">
                {(['timestamp', 'duration_ms', 'status'] as const).map(field => (
                  <button
                    key={field}
                    onClick={() => {
                      if (logSortField === field) {
                        setLogSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      } else {
                        setLogSortField(field);
                        setLogSortDir('desc');
                      }
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${logSortField === field ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {field === 'timestamp' ? 'Time' : field === 'duration_ms' ? 'Duration' : 'Status'}
                    {logSortField === field && (logSortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Table */}
            <div className="bg-[#111827] border border-slate-700/40 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/40">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">Time</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">Method</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">Path</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">Duration</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider">IP (Origin)</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.slice(0, 100).map(log => (
                      <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${methodColor(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-mono max-w-[200px] truncate">{log.path}</td>
                        <td className={`py-2.5 px-4 font-semibold tabular-nums ${statusColor(log.status)}`}>{log.status}</td>
                        <td className={`py-2.5 px-4 font-mono tabular-nums ${log.duration_ms > 500 ? 'text-red-400' : log.duration_ms > 100 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {log.duration_ms}ms
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono">{log.ip}</td>
                        <td className="py-2.5 px-4">
                          <button onClick={() => setSelectedLog(log)} className="p-1 text-slate-600 hover:text-amber-400 transition-colors" title="View Details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-xs">
                    {logs.length === 0 ? 'No request logs recorded yet' : 'No logs match your filters'}
                  </div>
                )}
              </div>
            </div>

            {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
          </div>
        )}

        {/* ─── DATA EXPLORER TAB ─────────────────────────────────────── */}
        {tab === 'data' && dataOverview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={Database} label="Total Items" value={dataOverview.total_items.toLocaleString()} />
              <StatCard icon={HardDrive} label="Total Size" value={formatBytes(dataOverview.total_size_bytes)} />
              <StatCard icon={Server} label="Collections" value={dataOverview.collections.length} />
            </div>

            <div className="space-y-3">
              {dataOverview.collections.map(col => (
                <div key={col.name} className="bg-[#111827] border border-slate-700/40 rounded-xl overflow-hidden">
                  <button
                    onClick={() => {
                      if (expandedCollection === col.endpoint) {
                        setExpandedCollection(null);
                      } else {
                        setExpandedCollection(col.endpoint);
                        loadCollectionData(col.endpoint);
                      }
                      setCollectionSearch('');
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <div className="text-sm text-white font-medium font-sans">{col.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{col.file} • {col.endpoint}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-300 font-mono tabular-nums">{col.count.toLocaleString()} items</div>
                        <div className="text-[10px] text-slate-600">{formatBytes(col.file_size_bytes)}</div>
                      </div>
                      {col.error ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : expandedCollection === col.endpoint ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {expandedCollection === col.endpoint && collectionData[col.endpoint] && (
                    <div className="border-t border-slate-700/40">
                      <div className="p-3 border-b border-slate-800/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            value={collectionSearch}
                            onChange={e => setCollectionSearch(e.target.value)}
                            placeholder={`Search ${col.name}...`}
                            className="w-full pl-9 pr-4 py-2 bg-[#0a0e17] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-sans"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        {(() => {
                          const data = collectionData[col.endpoint] as Record<string, unknown>[];
                          if (!data || data.length === 0) return <p className="p-4 text-xs text-slate-600">No data</p>;

                          const firstItem = data[0];
                          const isPandal = 'api_name' in firstItem;
                          const columns = isPandal
                            ? ['name', 'api_name', 'address', 'lat', 'lon', 'status']
                            : ['title', 'subTitle', 'categoryName', 'address', 'city'];

                          const filteredData = collectionSearch
                            ? data.filter(item =>
                                columns.some(c => {
                                  const val = item[c];
                                  return val && String(val).toLowerCase().includes(collectionSearch.toLowerCase());
                                })
                              )
                            : data;

                          return (
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 bg-[#111827]">
                                <tr className="border-b border-slate-700/40">
                                  <th className="text-left py-2 px-3 text-slate-500 font-medium">#</th>
                                  {columns.map(c => (
                                    <th key={c} className="text-left py-2 px-3 text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {filteredData.slice(0, 50).map((item, i) => (
                                  <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                                    <td className="py-2 px-3 text-slate-600 font-mono">{i + 1}</td>
                                    {columns.map(c => (
                                      <td key={c} className="py-2 px-3 text-slate-300 font-mono max-w-[200px] truncate">
                                        {item[c] !== null && item[c] !== undefined ? String(item[c]) : '—'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('pujopoth_admin_token');
    } catch {
      return null;
    }
  });

  const handleLogin = (t: string) => {
    setToken(t);
    try {
      sessionStorage.setItem('pujopoth_admin_token', t);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setToken(null);
    try {
      sessionStorage.removeItem('pujopoth_admin_token');
    } catch {
      // ignore
    }
    onBack();
  };

  return (
    <AdminErrorBoundary onReset={() => setToken(null)}>
      {!token ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <AdminDashboard token={token} onLogout={handleLogout} />
      )}
    </AdminErrorBoundary>
  );
}
