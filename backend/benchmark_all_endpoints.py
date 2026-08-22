import time
import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

endpoints = [
    ("GET", "/health", None),
    ("GET", "/api/launch-date", None),
    ("GET", "/api/trending", None),
    ("GET", "/api/pandals/north", None),
    ("GET", "/api/pandals/south", None),
    ("GET", "/api/pandals/central", None),
    ("GET", "/api/pandals/bonedi", None),
    ("GET", "/api/pandals", None),
    ("GET", "/api/home", None),
    ("GET", "/api/eateries/north", None),
    ("GET", "/api/eateries/south", None),
    ("GET", "/api/food/categories", None),
    ("GET", "/api/food/all_light", None),
    ("GET", "/api/food?page=1&limit=20", None),
    ("GET", "/api/food?q=biryani&page=1&limit=20", None),
    ("GET", "/api/facilities/north", None),
    ("GET", "/api/facilities/south", None),
    ("GET", "/api/medical-facilities", None),
    ("GET", "/api/metro-stations", None),
    ("GET", "/api/metros", None),
    ("GET", "/api/northpandel_distances", None),
    ("POST", "/api/plan-route", {
        "region": "north",
        "metro_station_name": "Shyambazar",
        "start_lat": 22.6035,
        "start_lon": 88.3704,
        "total_minutes": 180,
        "viewing_pace_minutes": 25,
        "restaurant_break_minutes": 30,
        "end_preference": "same_metro"
    }),
    ("GET", "/admin/stats", None),
    ("GET", "/admin/metrics/overview", None),
    ("GET", "/admin/metrics/dashboard", None)
]

def benchmark():
    print(f"{'Method':<6} | {'Endpoint':<38} | {'Status':<6} | {'Size (KB)':<10} | {'Run 1 (ms)':<11} | {'Run 2 (ms)':<11} | {'Run 3 (ms)':<11} | {'Avg (ms)':<10}")
    print("-" * 115)

    for method, path, body in endpoints:
        durations = []
        status = 0
        resp_size = 0

        for run in range(3):
            url = f"{BASE_URL}{path}"
            headers = {"x-admin-token": "PujoAdmin2026"}
            data = None
            if body:
                data = json.dumps(body).encode('utf-8')
                headers["Content-Type"] = "application/json"

            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            t0 = time.perf_counter()
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_bytes = resp.read()
                    elapsed = (time.perf_counter() - t0) * 1000
                    durations.append(elapsed)
                    status = resp.status
                    resp_size = len(resp_bytes)
            except urllib.error.HTTPError as e:
                elapsed = (time.perf_counter() - t0) * 1000
                durations.append(elapsed)
                status = e.code
                resp_size = len(e.read())
            except Exception as e:
                durations.append(-1)
                status = 0

        avg_dur = sum(durations) / len(durations) if durations else 0
        kb = resp_size / 1024
        print(f"{method:<6} | {path:<38} | {status:<6} | {kb:<10.1f} | {durations[0]:<11.2f} | {durations[1]:<11.2f} | {durations[2]:<11.2f} | {avg_dur:<10.2f}")

if __name__ == '__main__':
    benchmark()
