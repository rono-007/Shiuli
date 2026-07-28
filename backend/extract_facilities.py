import os
import json
import geopandas as gpd
import pandas as pd

GPKG_PATH = r"d:\PujoPoth\backend\data\planet_88.3384,22.543_88.424,22.5906.gpkg"
OUTPUT_JSON = r"d:\PujoPoth\backend\data\facilities.json"

CATEGORY_MAPPING = {
    "Restaurant": ("🍽️ Restaurant", {"amenity": ["restaurant", "food_court"], "shop": ["bakery"]}),
    "Cafe": ("☕ Cafe", {"amenity": ["cafe"]}),
    "Fast Food": ("🍔 Fast Food", {"amenity": ["fast_food"]}),
    "Hospital": ("🏥 Hospital", {"amenity": ["hospital"], "healthcare": ["hospital"]}),
    "Pharmacy": ("💊 Pharmacy", {"amenity": ["pharmacy"], "healthcare": ["pharmacy"]}),
    "Police": ("👮 Police", {"amenity": ["police"]}),
    "Fire Station": ("🚒 Fire Station", {"amenity": ["fire_station"]}),
    "Metro Station": ("🚇 Metro", {"railway": ["station", "subway"], "station": ["subway"]}),
    "Bus Stop": ("🚌 Bus Stop", {"highway": ["bus_stop"], "public_transport": ["platform", "stop_position"]}),
    "Bank / ATM": ("🏦 Bank/ATM", {"amenity": ["bank", "atm"]}),
    "Hotel": ("🏨 Hotel", {"tourism": ["hotel"]}),
    "Shopping Mall": ("🛍️ Mall", {"shop": ["mall"]}),
    "Market": ("🛒 Market", {"amenity": ["marketplace"]}),
    "Toilet": ("🚻 Toilet", {"amenity": ["toilets"]}),
    "Park": ("🌳 Park", {"leisure": ["park"]}),
}

def extract_facilities():
    if not os.path.exists(GPKG_PATH):
        print(f"GeoPackage file not found at: {GPKG_PATH}")
        return

    facilities = []
    seen_keys = set()

    for layer_name in ["points", "multipolygons", "other_relations"]:
        try:
            gdf = gpd.read_file(GPKG_PATH, layer=layer_name)
            if gdf.empty:
                continue

            if gdf.crs and gdf.crs.to_epsg() != 4326:
                gdf = gdf.to_crs(epsg=4326)

            for cat_name, (cat_label, criteria) in CATEGORY_MAPPING.items():
                mask = pd.Series(False, index=gdf.index)
                for col, vals in criteria.items():
                    if col in gdf.columns:
                        mask = mask | gdf[col].isin(vals)
                
                matched = gdf[mask]
                for idx, row in matched.iterrows():
                    geom = row.geometry
                    if geom is None or geom.is_empty:
                        continue
                    
                    centroid = geom.centroid if geom.geom_type != "Point" else geom
                    lat = round(float(centroid.y), 5)
                    lon = round(float(centroid.x), 5)

                    name = row.get("name")
                    if pd.isna(name) or not str(name).strip() or str(name).strip().isdigit():
                        # Skip unnamed or pure digit features if not prominent
                        continue

                    name = str(name).strip()
                    
                    dedup_key = (name.lower(), round(lat, 3), round(lon, 3))
                    if dedup_key in seen_keys:
                        continue
                    seen_keys.add(dedup_key)

                    facilities.append({
                        "name": name,
                        "category": cat_label,
                        "lat": lat,
                        "lon": lon,
                        "type": cat_name
                    })

        except Exception as e:
            print(f"Error processing layer {layer_name}: {e}")

    print(f"Extracted {len(facilities)} facilities.")
    
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(facilities, f, ensure_ascii=False, indent=2)

    print(f"Saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    extract_facilities()
