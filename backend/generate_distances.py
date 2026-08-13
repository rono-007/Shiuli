import json
import math
import os

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def main():
    # North Kolkata Metro Stations (including common spelling variants)
    north_metro_names = {
        "Dakshineswar", "Baranagar", "Noapara", "Dum Dum", "Belgachia", 
        "Shyambazar", "Shobhabazar Sutanuti", "Sovabazar", "Sovabazar Sutanuti", "Sovabazar Ahiritola",
        "Girish Park", "Mahatma Gandhi Road", "Central"
    }

    # Load Metro Stations from backend data/metro_stations.json
    metro_stations = []
    seen_names = set()

    def add_metro(name, lat, lon):
        if name not in seen_names:
            seen_names.add(name)
            metro_stations.append({"name": name, "lat": float(lat), "lon": float(lon)})

    try:
        with open("data/metro_stations.json", "r", encoding="utf-8") as f:
            all_metros = json.load(f)
            for m in all_metros:
                name = m.get("title") or m.get("name")
                if any(n.lower() in name.lower() for n in ["dakshineswar", "baranagar", "noapara", "dum dum", "belgachia", "shyambazar", "shobhabazar", "sovabazar", "girish park", "mahatma gandhi", "central"]):
                    add_metro(name, m["lat"], m["lon"])
    except Exception as e:
        print(f"Failed to load metro_stations.json: {e}")

    # Also load from frontend metros.json for full frontend station name coverage
    frontend_path = os.path.join("..", "frontend", "src", "data", "metros.json")
    if os.path.exists(frontend_path):
        try:
            with open(frontend_path, "r", encoding="utf-8") as f:
                f_metros = json.load(f)
                for m in f_metros:
                    title = m.get("title", "")
                    if any(n.lower() in title.lower() for n in ["dakshineswar", "baranagar", "noapara", "dum dum", "belgachia", "shyambazar", "shobhabazar", "sovabazar", "girish park", "mahatma gandhi", "central"]):
                        if m.get("location") and m["location"].get("lat") and m["location"].get("lng"):
                            add_metro(title, m["location"]["lat"], m["location"]["lng"])
        except Exception as e:
            print(f"Failed to load frontend metros.json: {e}")

    print(f"Loaded {len(metro_stations)} North Kolkata metro station variants.")

    # Load North Pandals
    north_pandals = []
    try:
        with open("data/north_cords.json", "r", encoding="utf-8") as f:
            all_pandals = json.load(f)
            for p in all_pandals:
                if p.get("lat") and p.get("lon"):
                    north_pandals.append({
                        "title": p.get("name") or p.get("api_name") or "Durga Puja Pandal",
                        "address": p.get("address", ""),
                        "lat": float(p["lat"]),
                        "lon": float(p["lon"])
                    })
    except Exception as e:
        print(f"Failed to load north_cords.json: {e}")
        return

    print(f"Loaded {len(north_pandals)} North Kolkata pandals.")

    # Generate distances
    dataset = []

    for metro in metro_stations:
        metro_data = {
            "metro_station": metro["name"],
            "lat": metro["lat"],
            "lon": metro["lon"],
            "ranked_pandals": []
        }

        # Calculate distances to all pandals
        pandals_with_distance = []
        for p in north_pandals:
            dist_m = haversine_distance(metro["lat"], metro["lon"], p["lat"], p["lon"])
            # Calculate estimated walk time (approx 1m/s + 3 min buffer)
            walk_time_min = int(dist_m / 60) + 3

            # Only include pandals within 3km (3000 meters)
            if dist_m <= 3000:
                pandals_with_distance.append({
                    "title": p["title"],
                    "address": p["address"],
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "distance_meters": int(dist_m),
                    "estimated_walk_time_min": walk_time_min
                })

        # Sort by distance (closest first)
        pandals_with_distance.sort(key=lambda x: x["distance_meters"])

        metro_data["ranked_pandals"] = pandals_with_distance
        dataset.append(metro_data)

    # Save output
    output_path = "data/north_metro_pandals_ranked.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {output_path} with data for {len(dataset)} metro stations.")

if __name__ == "__main__":
    main()
