import os
import json

def get_base_dir():
    # Assuming scripts is located in backend/scripts
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(os.path.dirname(script_dir))

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def save_json(data, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        # Use separators=(',', ':') to minify
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"Saved {filepath} ({os.path.getsize(filepath) / 1024:.1f} KB)")

def optimize_eateries(north_path, south_path, central_path, out_path):
    print(f"Optimizing Eateries...")
    north_data = load_json(north_path) or []
    south_data = load_json(south_path) or []
    central_data = load_json(central_path) or []
    
    optimized = []
    seen_place_ids = set()
    seen_geo_keys = set()
    
    def process_item(item, zone):
        if not item or not item.get('location'): return None
        lat = item.get("location", {}).get("lat", 0.0)
        lng = item.get("location", {}).get("lng", 0.0)
        if not lat or not lng: return None
        
        pid = item.get('placeId')
        title = (item.get('title') or '').strip().lower()
        geo_key = (title, round(lat, 3), round(lng, 3))
        
        if pid and pid in seen_place_ids:
            return None
        if geo_key in seen_geo_keys:
            return None
            
        if pid: seen_place_ids.add(pid)
        seen_geo_keys.add(geo_key)
        
        return {
            "title": item.get("title", ""),
            "subTitle": item.get("subTitle", ""),
            "categoryName": item.get("categoryName", ""),
            "totalScore": item.get("totalScore", 0.0),
            "reviewsCount": item.get("reviewsCount", 0),
            "price": item.get("price", ""),
            "address": item.get("address", ""),
            "imageUrl": item.get("imageUrl", ""),
            "location": {
                "lat": lat,
                "lng": lng
            },
            "permanentlyClosed": item.get("permanentlyClosed", False),
            "url": item.get("url", ""),
            "zone": zone
        }

    for item in central_data:
        opt = process_item(item, 'central')
        if opt: optimized.append(opt)

    for item in north_data:
        opt = process_item(item, 'north')
        if opt: optimized.append(opt)
        
    for item in south_data:
        opt = process_item(item, 'south')
        if opt: optimized.append(opt)
        
    save_json(optimized, out_path)


def optimize_facilities(path, out_path):
    print(f"Optimizing Facilities ({os.path.basename(path)})...")
    data = load_json(path) or []
    optimized = []
    
    for item in data:
        if not item or not item.get('location'): continue
        optimized.append({
            "title": item.get("title", ""),
            "subTitle": item.get("subTitle", ""),
            "categoryName": item.get("categoryName", ""),
            "totalScore": item.get("totalScore", 0.0),
            "reviewsCount": item.get("reviewsCount", 0),
            "address": item.get("address", ""),
            "location": {
                "lat": item.get("location", {}).get("lat", 0.0),
                "lng": item.get("location", {}).get("lng", 0.0)
            },
            "url": item.get("url", "")
        })
    save_json(optimized, out_path)

def optimize_pandals(path, out_path):
    print(f"Optimizing Pandals ({os.path.basename(path)})...")
    data = load_json(path) or []
    optimized = []
    
    for item in data:
        if not item: continue
        optimized.append({
            "name": item.get("name", ""),
            "api_name": item.get("api_name", ""),
            "address": item.get("address", ""),
            "lat": item.get("lat", 0.0),
            "lon": item.get("lon", 0.0),
            "status": item.get("status", "")
        })
    save_json(optimized, out_path)

def optimize_metros(path, out_path):
    print(f"Optimizing Metros ({os.path.basename(path)})...")
    data = load_json(path) or []
    optimized = []
    
    for item in data:
        if not item: continue
        
        # Check format (metros.json vs metro_stations.json)
        if "location" in item and "title" in item:
            optimized.append({
                "title": item.get("title", ""),
                "subTitle": item.get("subTitle", ""),
                "address": item.get("address", ""),
                "location": {
                    "lat": item.get("location", {}).get("lat", 0.0),
                    "lng": item.get("location", {}).get("lng", 0.0)
                }
            })
        elif "lat" in item and "lon" in item:
            optimized.append({
                "name": item.get("name", ""),
                "api_name": item.get("api_name", ""),
                "line": item.get("line", ""),
                "address": item.get("address", ""),
                "lat": item.get("lat", 0.0),
                "lon": item.get("lon", 0.0)
            })
    save_json(optimized, out_path)

def optimize_cords(path, out_path):
    print(f"Optimizing Cords ({os.path.basename(path)})...")
    data = load_json(path) or []
    save_json(data, out_path)  # usually already minimal

def optimize_trending(path, out_path):
    print(f"Optimizing Trending ({os.path.basename(path)})...")
    data = load_json(path) or {}
    save_json(data, out_path)

def main():
    base_dir = get_base_dir()
    data_in = os.path.join(base_dir, 'backend', 'data')
    data_out = os.path.join(base_dir, 'frontend', 'public', 'data')
    
    print(f"Base Directory: {base_dir}")
    print(f"Input: {data_in}")
    print(f"Output: {data_out}")
    
    # Exclude sensitive data explicitly
    sensitive_files = ['beta_users.json', 'feedback_messages.json']
    
    # 1. Eateries (combine north, south, and central into one lightweight file)
    optimize_eateries(
        os.path.join(data_in, 'north_eateries.json'),
        os.path.join(data_in, 'south_eateries.json'),
        os.path.join(data_in, 'central_eateries.json'),
        os.path.join(data_out, 'eateries_light.json')
    )
    
    # 2. Facilities
    optimize_facilities(os.path.join(data_in, 'north_other_facilities.json'), os.path.join(data_out, 'north_facilities_light.json'))
    optimize_facilities(os.path.join(data_in, 'south_other_facilites.json'), os.path.join(data_out, 'south_facilities_light.json'))
    
    # 3. Pandals
    optimize_pandals(os.path.join(data_in, 'north_cords.json'), os.path.join(data_out, 'north_pandals.json'))
    optimize_pandals(os.path.join(data_in, 'south_kolkata.json'), os.path.join(data_out, 'south_pandals.json'))
    optimize_pandals(os.path.join(data_in, 'central_kolkata.json'), os.path.join(data_out, 'central_pandals.json'))
    optimize_pandals(os.path.join(data_in, 'bonedi_kolkata.json'), os.path.join(data_out, 'bonedi_pandals.json'))
    
    # 4. Metros
    optimize_metros(os.path.join(data_in, 'metros.json'), os.path.join(data_out, 'metros.json'))
    optimize_metros(os.path.join(data_in, 'metro_stations.json'), os.path.join(data_out, 'metro_stations.json'))
    
    # 5. Cords
    optimize_cords(os.path.join(data_in, 'north_cords.json'), os.path.join(data_out, 'north_cords.json'))
    
    # 6. Trending
    optimize_trending(os.path.join(data_in, 'trending.json'), os.path.join(data_out, 'trending.json'))
    
    print("Optimization Complete.")

if __name__ == "__main__":
    main()
