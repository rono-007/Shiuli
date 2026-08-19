"""
PujoPoth Performance Metrics Engine — Phase 1: Observability Only
==================================================================
Thread-safe, in-memory metrics collection with:
- Per-request recording
- Minute-by-minute aggregation with correct percentile calculation
- Feature-level grouping
- Slow request tracking
- Error aggregation
- Cold-start detection
- Auto-pruning (60-minute retention)

Memory budget: ~2 MB for 60 minutes of data across all endpoints.
"""

import time
import threading
import math
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any


# ─── Feature Mapping ──────────────────────────────────────────────────────────
# Maps API path prefixes to Shiuli features for feature-level metrics.

FEATURE_MAP = {
    "/api/food": "Food",
    "/api/eateries": "Food",
    "/api/pandals/bonedi": "Bonedi Puja",
    "/api/pandals": "Pandals",
    "/api/home": "Pandals",
    "/api/metro": "Metro",
    "/api/metros": "Metro",
    "/api/facilities": "Facilities",
    "/api/medical": "Medical",
    "/api/map": "Location",
    "/api/plan-route": "Location",
    "/api/northpandel_distances": "Location",
    "/api/feedback": "Feedback",
    "/api/beta": "Beta Access",
    "/admin": "Admin",
    "/api/mailservice": "Admin",
    "/api/launch-date": "Pandals",
    "/health": "System",
}


def _classify_feature(path: str) -> str:
    """Classify an API path into a Shiuli feature group."""
    # Check most specific prefixes first (longer paths first)
    for prefix in sorted(FEATURE_MAP.keys(), key=len, reverse=True):
        if path.startswith(prefix):
            return FEATURE_MAP[prefix]
    return "Other"


def _classify_slow(duration_ms: float) -> Optional[str]:
    """Classify a request's slowness level."""
    if duration_ms >= 5000:
        return "critical"
    elif duration_ms >= 2000:
        return "very_slow"
    elif duration_ms >= 1000:
        return "slow"
    elif duration_ms >= 500:
        return "moderate"
    return None


def _percentile(sorted_values: List[float], p: float) -> float:
    """Calculate the p-th percentile from a sorted list. Correct interpolation."""
    if not sorted_values:
        return 0.0
    n = len(sorted_values)
    if n == 1:
        return round(sorted_values[0], 2)
    k = (p / 100.0) * (n - 1)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return round(sorted_values[int(k)], 2)
    d0 = sorted_values[int(f)] * (c - k)
    d1 = sorted_values[int(c)] * (k - f)
    return round(d0 + d1, 2)


def _compute_latency_stats(durations: List[float]) -> Dict[str, float]:
    """Compute full latency statistics from a list of durations."""
    if not durations:
        return {
            "min": 0, "max": 0, "avg": 0,
            "p50": 0, "p75": 0, "p90": 0, "p95": 0, "p99": 0,
            "count": 0
        }
    s = sorted(durations)
    return {
        "min": round(s[0], 2),
        "max": round(s[-1], 2),
        "avg": round(sum(s) / len(s), 2),
        "p50": _percentile(s, 50),
        "p75": _percentile(s, 75),
        "p90": _percentile(s, 90),
        "p95": _percentile(s, 95),
        "p99": _percentile(s, 99),
        "count": len(s)
    }


# ─── Minute Bucket ─────────────────────────────────────────────────────────────

class MinuteBucket:
    """Stores aggregated metrics for a single minute window."""
    __slots__ = (
        "minute_key", "durations", "response_sizes",
        "total", "success", "client_errors", "server_errors",
        "cache_hits", "cache_misses",
        "slow_500", "slow_1000", "slow_2000", "slow_5000",
        "endpoint_durations", "endpoint_statuses", "endpoint_sizes",
        "endpoint_cache", "errors_by_endpoint",
    )

    def __init__(self, minute_key: str):
        self.minute_key = minute_key
        self.durations: List[float] = []
        self.response_sizes: List[int] = []
        self.total = 0
        self.success = 0
        self.client_errors = 0
        self.server_errors = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.slow_500 = 0
        self.slow_1000 = 0
        self.slow_2000 = 0
        self.slow_5000 = 0
        self.endpoint_durations: Dict[str, List[float]] = defaultdict(list)
        self.endpoint_statuses: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "success": 0, "4xx": 0, "5xx": 0})
        self.endpoint_sizes: Dict[str, List[int]] = defaultdict(list)
        self.endpoint_cache: Dict[str, Dict[str, int]] = defaultdict(lambda: {"hits": 0, "misses": 0})
        self.errors_by_endpoint: Dict[str, int] = defaultdict(int)

    def add(self, record: Dict[str, Any]):
        dur = record["total_ms"]
        status = record["status_code"]
        path = record["path"]
        resp_bytes = record.get("response_bytes", 0)
        cache = record.get("cache_status")

        self.total += 1
        self.durations.append(dur)
        self.response_sizes.append(resp_bytes)

        if status < 400:
            self.success += 1
            self.endpoint_statuses[path]["success"] += 1
        elif status < 500:
            self.client_errors += 1
            self.endpoint_statuses[path]["4xx"] += 1
            self.errors_by_endpoint[path] += 1
        else:
            self.server_errors += 1
            self.endpoint_statuses[path]["5xx"] += 1
            self.errors_by_endpoint[path] += 1

        self.endpoint_statuses[path]["total"] += 1
        self.endpoint_durations[path].append(dur)
        self.endpoint_sizes[path].append(resp_bytes)

        if cache == "hit":
            self.cache_hits += 1
            self.endpoint_cache[path]["hits"] += 1
        elif cache == "miss":
            self.cache_misses += 1
            self.endpoint_cache[path]["misses"] += 1

        if dur >= 5000:
            self.slow_5000 += 1
        if dur >= 2000:
            self.slow_2000 += 1
        if dur >= 1000:
            self.slow_1000 += 1
        if dur >= 500:
            self.slow_500 += 1

    def to_dict(self) -> Dict[str, Any]:
        """Serialize this minute bucket for API response."""
        latency = _compute_latency_stats(self.durations)
        total_transferred = sum(self.response_sizes)
        avg_size = round(total_transferred / self.total, 0) if self.total else 0
        cache_total = self.cache_hits + self.cache_misses
        cache_rate = round(self.cache_hits / cache_total * 100, 1) if cache_total else None

        return {
            "minute": self.minute_key,
            "requests": self.total,
            "success": self.success,
            "client_errors": self.client_errors,
            "server_errors": self.server_errors,
            "rpm": self.total,
            "latency": latency,
            "error_rate": round((self.client_errors + self.server_errors) / self.total * 100, 1) if self.total else 0,
            "payload": {
                "avg_bytes": int(avg_size),
                "min_bytes": min(self.response_sizes) if self.response_sizes else 0,
                "max_bytes": max(self.response_sizes) if self.response_sizes else 0,
                "total_transferred": total_transferred,
            },
            "cache": {
                "hits": self.cache_hits,
                "misses": self.cache_misses,
                "hit_rate": cache_rate,
            },
            "slow": {
                "gt_500ms": self.slow_500,
                "gt_1s": self.slow_1000,
                "gt_2s": self.slow_2000,
                "gt_5s": self.slow_5000,
            },
        }

    def endpoint_dict(self, path: str) -> Dict[str, Any]:
        """Get per-endpoint stats within this minute."""
        durs = self.endpoint_durations.get(path, [])
        sizes = self.endpoint_sizes.get(path, [])
        statuses = self.endpoint_statuses.get(path, {"total": 0, "success": 0, "4xx": 0, "5xx": 0})
        cache = self.endpoint_cache.get(path, {"hits": 0, "misses": 0})
        cache_total = cache["hits"] + cache["misses"]

        return {
            "endpoint": path,
            "requests": statuses["total"],
            "latency": _compute_latency_stats(durs),
            "success": statuses["success"],
            "client_errors": statuses["4xx"],
            "server_errors": statuses["5xx"],
            "error_rate": round((statuses["4xx"] + statuses["5xx"]) / statuses["total"] * 100, 1) if statuses["total"] else 0,
            "avg_response_bytes": round(sum(sizes) / len(sizes), 0) if sizes else 0,
            "cache_hit_rate": round(cache["hits"] / cache_total * 100, 1) if cache_total else None,
        }


# ─── Metrics Collector (Singleton) ─────────────────────────────────────────────

class MetricsCollector:
    """
    Central metrics collector. Thread-safe.
    
    - Records every request.
    - Aggregates into 1-minute buckets.
    - Retains 60 minutes of history.
    - Tracks slow requests and errors separately.
    """

    def __init__(self, slow_threshold_ms: float = 500.0, max_recent: int = 2000,
                 max_slow: int = 200, max_errors: int = 200, retention_minutes: int = 60):
        self._lock = threading.Lock()
        self._minute_buckets: Dict[str, MinuteBucket] = {}
        self._recent_requests: deque = deque(maxlen=max_recent)
        self._slow_requests: deque = deque(maxlen=max_slow)
        self._recent_errors: deque = deque(maxlen=max_errors)

        self.slow_threshold_ms = slow_threshold_ms
        self.retention_minutes = retention_minutes

        # Cold-start tracking
        self.server_boot_time = time.perf_counter()
        self.server_boot_utc = datetime.now(timezone.utc)
        self._first_request_time: Optional[float] = None
        self._cold_start_window_s = 10.0  # First 10s after boot = cold start zone
        self._request_count = 0

    def _minute_key(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d %H:%M")

    def _prune_old_buckets(self):
        """Remove minute buckets older than retention period."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=self.retention_minutes)
        cutoff_key = self._minute_key(cutoff)
        old_keys = [k for k in self._minute_buckets if k < cutoff_key]
        for k in old_keys:
            del self._minute_buckets[k]

    def record_request(self, record: Dict[str, Any]):
        """
        Record a completed request's metrics.
        
        Expected record keys:
            request_id, timestamp, method, path, query_params, status_code,
            total_ms, response_bytes, content_type, request_bytes,
            error_occurred, error_type, error_status, error_message,
            cache_status, endpoint_timings
        """
        with self._lock:
            self._request_count += 1

            # Cold-start detection
            now_mono = time.perf_counter()
            if self._first_request_time is None:
                self._first_request_time = now_mono
                record["cold_start"] = True
                record["boot_duration_ms"] = round((now_mono - self.server_boot_time) * 1000, 2)
            elif (now_mono - self.server_boot_time) < self._cold_start_window_s:
                record["cold_start"] = True
            else:
                record["cold_start"] = False

            # Classify feature
            record["feature"] = _classify_feature(record.get("path", ""))

            # Classify slowness
            slow_class = _classify_slow(record["total_ms"])
            record["slow_class"] = slow_class

            # Store in recent requests
            self._recent_requests.appendleft(record)

            # Store slow requests
            if slow_class is not None:
                self._slow_requests.appendleft(record)

            # Store errors
            if record.get("error_occurred") or record.get("status_code", 200) >= 400:
                self._recent_errors.appendleft(record)

            # Aggregate into minute bucket
            ts = record.get("timestamp", datetime.now(timezone.utc).isoformat())
            try:
                dt = datetime.fromisoformat(ts)
            except (ValueError, TypeError):
                dt = datetime.now(timezone.utc)
            mk = self._minute_key(dt)

            if mk not in self._minute_buckets:
                self._minute_buckets[mk] = MinuteBucket(mk)
            self._minute_buckets[mk].add(record)

            # Periodic pruning (every 100 requests)
            if self._request_count % 100 == 0:
                self._prune_old_buckets()

    # ─── Query Methods ─────────────────────────────────────────────────────

    def get_overview(self) -> Dict[str, Any]:
        """Global overview: current RPM, latency, error rate, cold-start info."""
        with self._lock:
            now = datetime.now(timezone.utc)
            current_mk = self._minute_key(now)
            prev_mk = self._minute_key(now - timedelta(minutes=1))

            current_bucket = self._minute_buckets.get(current_mk)
            prev_bucket = self._minute_buckets.get(prev_mk)

            # Use previous minute if current is too fresh
            active_bucket = prev_bucket if (prev_bucket and prev_bucket.total > 0) else current_bucket

            uptime_s = round(time.perf_counter() - self.server_boot_time, 1)
            boot_duration_ms = None
            if self._first_request_time is not None:
                boot_duration_ms = round((self._first_request_time - self.server_boot_time) * 1000, 2)

            overview = {
                "timestamp": now.isoformat(),
                "uptime_seconds": uptime_s,
                "total_requests": self._request_count,
                "boot_duration_ms": boot_duration_ms,
                "server_boot_utc": self.server_boot_utc.isoformat(),
                "is_cold": uptime_s < self._cold_start_window_s,
                "retention_minutes": self.retention_minutes,
                "minutes_stored": len(self._minute_buckets),
                "slow_threshold_ms": self.slow_threshold_ms,
            }

            if active_bucket and active_bucket.total > 0:
                bdata = active_bucket.to_dict()
                overview["current"] = {
                    "minute": bdata["minute"],
                    "rpm": bdata["rpm"],
                    "avg_ms": bdata["latency"]["avg"],
                    "p50_ms": bdata["latency"]["p50"],
                    "p95_ms": bdata["latency"]["p95"],
                    "p99_ms": bdata["latency"]["p99"],
                    "error_rate": bdata["error_rate"],
                    "slow_requests": bdata["slow"]["gt_500ms"],
                    "cache_hit_rate": bdata["cache"]["hit_rate"],
                }
            else:
                overview["current"] = None

            return overview

    def get_minute_metrics(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """Return minute-by-minute metrics for the last N minutes."""
        with self._lock:
            self._prune_old_buckets()
            sorted_keys = sorted(self._minute_buckets.keys())[-minutes:]
            return [self._minute_buckets[k].to_dict() for k in sorted_keys]

    def get_endpoint_summary(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """Aggregate per-endpoint metrics over the last N minutes."""
        with self._lock:
            self._prune_old_buckets()
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
            cutoff_key = self._minute_key(cutoff)

            # Aggregate across all minute buckets
            ep_durations: Dict[str, List[float]] = defaultdict(list)
            ep_statuses: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "success": 0, "4xx": 0, "5xx": 0})
            ep_sizes: Dict[str, List[int]] = defaultdict(list)
            ep_cache: Dict[str, Dict[str, int]] = defaultdict(lambda: {"hits": 0, "misses": 0})

            for mk, bucket in self._minute_buckets.items():
                if mk < cutoff_key:
                    continue
                for path in bucket.endpoint_durations:
                    ep_durations[path].extend(bucket.endpoint_durations[path])
                    s = bucket.endpoint_statuses.get(path, {"total": 0, "success": 0, "4xx": 0, "5xx": 0})
                    ep_statuses[path]["total"] += s["total"]
                    ep_statuses[path]["success"] += s["success"]
                    ep_statuses[path]["4xx"] += s["4xx"]
                    ep_statuses[path]["5xx"] += s["5xx"]
                    ep_sizes[path].extend(bucket.endpoint_sizes.get(path, []))
                    c = bucket.endpoint_cache.get(path, {"hits": 0, "misses": 0})
                    ep_cache[path]["hits"] += c["hits"]
                    ep_cache[path]["misses"] += c["misses"]

            result = []
            active_minutes = len([mk for mk in self._minute_buckets if mk >= cutoff_key])
            for path in ep_durations:
                durs = ep_durations[path]
                sizes = ep_sizes[path]
                s = ep_statuses[path]
                c = ep_cache[path]
                c_total = c["hits"] + c["misses"]
                total = s["total"]
                rpm = round(total / max(active_minutes, 1), 1)

                result.append({
                    "endpoint": path,
                    "feature": _classify_feature(path),
                    "requests": total,
                    "rpm": rpm,
                    "latency": _compute_latency_stats(durs),
                    "success": s["success"],
                    "client_errors": s["4xx"],
                    "server_errors": s["5xx"],
                    "error_rate": round((s["4xx"] + s["5xx"]) / total * 100, 1) if total else 0,
                    "avg_response_bytes": round(sum(sizes) / len(sizes), 0) if sizes else 0,
                    "cache_hit_rate": round(c["hits"] / c_total * 100, 1) if c_total else None,
                })

            return sorted(result, key=lambda x: x["requests"], reverse=True)

    def get_feature_metrics(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """Aggregate metrics by Shiuli feature."""
        with self._lock:
            self._prune_old_buckets()
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
            cutoff_key = self._minute_key(cutoff)

            feat_durations: Dict[str, List[float]] = defaultdict(list)
            feat_counts: Dict[str, int] = defaultdict(int)
            feat_errors: Dict[str, int] = defaultdict(int)
            feat_sizes: Dict[str, List[int]] = defaultdict(list)
            feat_slow: Dict[str, int] = defaultdict(int)

            for mk, bucket in self._minute_buckets.items():
                if mk < cutoff_key:
                    continue
                for path, durs in bucket.endpoint_durations.items():
                    feature = _classify_feature(path)
                    feat_durations[feature].extend(durs)
                    s = bucket.endpoint_statuses.get(path, {"total": 0, "4xx": 0, "5xx": 0})
                    feat_counts[feature] += s.get("total", 0)
                    feat_errors[feature] += s.get("4xx", 0) + s.get("5xx", 0)
                    feat_sizes[feature].extend(bucket.endpoint_sizes.get(path, []))
                    for d in durs:
                        if d >= 500:
                            feat_slow[feature] += 1

            active_minutes = max(len([mk for mk in self._minute_buckets if mk >= cutoff_key]), 1)
            result = []
            for feature in feat_durations:
                durs = feat_durations[feature]
                total = feat_counts[feature]
                result.append({
                    "feature": feature,
                    "requests": total,
                    "rpm": round(total / active_minutes, 1),
                    "latency": _compute_latency_stats(durs),
                    "error_rate": round(feat_errors[feature] / total * 100, 1) if total else 0,
                    "slow_count": feat_slow[feature],
                    "total_transferred": sum(feat_sizes[feature]),
                })

            return sorted(result, key=lambda x: x["requests"], reverse=True)

    def get_slow_requests(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return recent slow requests with full timing breakdown."""
        with self._lock:
            result = []
            for r in list(self._slow_requests)[:limit]:
                result.append({
                    "request_id": r.get("request_id"),
                    "timestamp": r.get("timestamp"),
                    "method": r.get("method"),
                    "path": r.get("path"),
                    "feature": r.get("feature"),
                    "status_code": r.get("status_code"),
                    "total_ms": r.get("total_ms"),
                    "slow_class": r.get("slow_class"),
                    "response_bytes": r.get("response_bytes"),
                    "cache_status": r.get("cache_status"),
                    "cold_start": r.get("cold_start"),
                    "endpoint_timings": r.get("endpoint_timings"),
                })
            return result

    def get_error_summary(self, minutes: int = 60) -> Dict[str, Any]:
        """Return error aggregation: by minute, by endpoint, recent errors."""
        with self._lock:
            self._prune_old_buckets()
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
            cutoff_key = self._minute_key(cutoff)

            # Minute-level error trend
            minute_errors = []
            for mk in sorted(self._minute_buckets.keys()):
                if mk < cutoff_key:
                    continue
                b = self._minute_buckets[mk]
                minute_errors.append({
                    "minute": mk,
                    "total_errors": b.client_errors + b.server_errors,
                    "client_errors": b.client_errors,
                    "server_errors": b.server_errors,
                    "error_rate": round((b.client_errors + b.server_errors) / b.total * 100, 1) if b.total else 0,
                })

            # Errors by endpoint (aggregate)
            ep_errors: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "4xx": 0, "5xx": 0})
            for mk, bucket in self._minute_buckets.items():
                if mk < cutoff_key:
                    continue
                for path, s in bucket.endpoint_statuses.items():
                    ep_errors[path]["total"] += s["4xx"] + s["5xx"]
                    ep_errors[path]["4xx"] += s["4xx"]
                    ep_errors[path]["5xx"] += s["5xx"]

            errors_by_endpoint = sorted(
                [{"endpoint": p, **v} for p, v in ep_errors.items() if v["total"] > 0],
                key=lambda x: x["total"], reverse=True
            )

            # Recent errors
            recent = []
            for r in list(self._recent_errors)[:30]:
                recent.append({
                    "request_id": r.get("request_id"),
                    "timestamp": r.get("timestamp"),
                    "method": r.get("method"),
                    "path": r.get("path"),
                    "status_code": r.get("status_code"),
                    "error_type": r.get("error_type"),
                    "error_message": r.get("error_message"),
                    "total_ms": r.get("total_ms"),
                })

            return {
                "minute_trend": minute_errors,
                "by_endpoint": errors_by_endpoint,
                "recent_errors": recent,
            }

    def get_global_minute_metrics(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """
        Global per-minute stats including most requested endpoint,
        slowest endpoint, and highest error rate endpoint.
        """
        with self._lock:
            self._prune_old_buckets()
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
            cutoff_key = self._minute_key(cutoff)

            result = []
            for mk in sorted(self._minute_buckets.keys()):
                if mk < cutoff_key:
                    continue
                b = self._minute_buckets[mk]
                base = b.to_dict()

                # Find most requested, slowest, highest error endpoint this minute
                most_requested = max(b.endpoint_statuses.items(), key=lambda x: x[1]["total"], default=(None, {"total": 0}))
                slowest = None
                max_avg = 0
                for ep, durs in b.endpoint_durations.items():
                    avg = sum(durs) / len(durs) if durs else 0
                    if avg > max_avg:
                        max_avg = avg
                        slowest = ep
                highest_err = None
                max_err_rate = 0
                for ep, s in b.endpoint_statuses.items():
                    total = s["total"]
                    if total > 0:
                        rate = (s["4xx"] + s["5xx"]) / total
                        if rate > max_err_rate:
                            max_err_rate = rate
                            highest_err = ep

                base["most_requested_endpoint"] = most_requested[0]
                base["slowest_endpoint"] = slowest
                base["slowest_endpoint_avg_ms"] = round(max_avg, 2) if slowest else None
                base["highest_error_endpoint"] = highest_err
                base["highest_error_rate"] = round(max_err_rate * 100, 1) if highest_err else None

                result.append(base)

            return result

    def receive_client_metrics(self, data: Dict[str, Any]):
        """Store frontend performance metrics (Core Web Vitals, API timings)."""
        with self._lock:
            # Store in a simple attribute for the dashboard to read
            if not hasattr(self, '_client_metrics'):
                self._client_metrics = deque(maxlen=100)
            self._client_metrics.appendleft({
                "received_at": datetime.now(timezone.utc).isoformat(),
                **data
            })

    def get_client_metrics(self) -> List[Dict[str, Any]]:
        """Return stored client-side metrics."""
        with self._lock:
            if not hasattr(self, '_client_metrics'):
                return []
            return list(self._client_metrics)


# ─── Global Singleton ──────────────────────────────────────────────────────────

metrics_collector = MetricsCollector()
