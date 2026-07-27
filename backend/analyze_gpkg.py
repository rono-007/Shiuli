import os
import json
import logging
import pyogrio
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Point, LineString, Polygon, MultiPolygon
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

GPKG_PATH = r"d:\PujoPoth\backend\data\planet_88.3384,22.543_88.424,22.5906.gpkg"
OUTPUT_DIR = r"d:\PujoPoth\backend\analysis_output"

IMPORTANT_GIS_COLUMNS = [
    'name', 'amenity', 'tourism', 'railway', 'public_transport', 'station', 
    'highway', 'shop', 'office', 'leisure', 'healthcare', 'landuse', 
    'building', 'brand', 'operator', 'cuisine'
]

def create_output_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        logger.info(f"Created output directory at {OUTPUT_DIR}")

def analyze_gpkg(file_path):
    create_output_dir()
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return

    logger.info(f"Analyzing GeoPackage: {file_path}")
    
    try:
        layers = pyogrio.list_layers(file_path)
        # pyogrio.list_layers returns a list of tuples: [('layer1', 'Point'), ('layer2', 'LineString')]
        layers = [layer[0] for layer in layers]
    except Exception as e:
        logger.error(f"Failed to list layers: {e}")
        return

    logger.info(f"Detected {len(layers)} layers: {layers}")

    layers_summary = []
    columns_summary = []
    categories_summary = []
    layer_statistics = {}
    sample_features = {}
    unique_values = {}

    all_gdf = {}

    for layer_name in layers:
        logger.info(f"\n{'='*50}\nProcessing Layer: {layer_name}\n{'='*50}")
        try:
            # Read layer
            gdf = gpd.read_file(file_path, layer=layer_name)
            all_gdf[layer_name] = gdf
            
            # Step 1 - Inspect the GeoPackage
            num_features = len(gdf)
            geom_types = gdf.geom_type.unique().tolist() if 'geometry' in gdf.columns else []
            crs = str(gdf.crs) if gdf.crs else "Unknown"
            bbox = gdf.total_bounds.tolist() if 'geometry' in gdf.columns and num_features > 0 else []
            
            logger.info(f"Layer: {layer_name}")
            logger.info(f"Number of records: {num_features}")
            logger.info(f"Geometry type: {geom_types}")
            logger.info(f"CRS: {crs}")
            logger.info(f"Bounding box: {bbox}")

            layers_summary.append({
                'Layer': layer_name,
                'Records': num_features,
                'Geometry_Types': ", ".join(geom_types) if geom_types else "None",
                'CRS': crs,
                'Bounding_Box': str(bbox)
            })

            layer_statistics[layer_name] = {
                'records': num_features,
                'geometry_types': geom_types,
                'crs': crs,
                'bbox': bbox
            }

            if num_features == 0:
                logger.warning(f"Layer {layer_name} is empty.")
                continue

            # Export first 100 rows to CSV
            csv_export_path = os.path.join(OUTPUT_DIR, f"{layer_name}_sample100.csv")
            gdf.head(100).drop(columns=['geometry'], errors='ignore').to_csv(csv_export_path, index=False)
            
            # Step 2 - Inspect Every Attribute
            logger.info("\n--- Attributes ---")
            layer_unique_vals = {}
            layer_samples = json.loads(gdf.head(10).drop(columns=['geometry'], errors='ignore').to_json(orient='records'))
            sample_features[layer_name] = layer_samples

            for col in gdf.columns:
                if col == 'geometry':
                    continue
                dtype = str(gdf[col].dtype)
                null_count = int(gdf[col].isna().sum())
                unique_count = int(gdf[col].nunique())
                
                columns_summary.append({
                    'Layer': layer_name,
                    'Column': col,
                    'DataType': dtype,
                    'Null_Count': null_count,
                    'Unique_Count': unique_count
                })

                # Store unique values if reasonable number
                if unique_count > 0 and unique_count < 100:
                    layer_unique_vals[col] = gdf[col].dropna().unique().tolist()
                elif unique_count >= 100:
                    layer_unique_vals[col] = f"{unique_count} unique values (too many to list)"

            unique_values[layer_name] = layer_unique_vals
            
            # Detect Important GIS Columns
            detected_important = [col for col in IMPORTANT_GIS_COLUMNS if col in gdf.columns]
            if detected_important:
                logger.info(f"Detected important GIS columns: {detected_important}")
            
            # Step 8 - Geometry Validation
            logger.info("\n--- Geometry Validation ---")
            if 'geometry' in gdf.columns:
                invalid_geoms = (~gdf.is_valid).sum()
                empty_geoms = gdf.is_empty.sum()
                missing_coords = gdf['geometry'].isna().sum()
                
                # Check for duplicate geometries by wkb
                # WKB (Well Known Binary) is a good way to check exact geometry duplicates
                dup_geoms = gdf['geometry'].apply(lambda geom: geom.wkb if geom else None).duplicated().sum()
                
                dup_names = gdf['name'].duplicated().sum() if 'name' in gdf.columns else 0
                
                logger.info(f"Invalid geometries: {invalid_geoms}")
                logger.info(f"Empty geometries: {empty_geoms}")
                logger.info(f"Duplicate geometries: {dup_geoms}")
                logger.info(f"Duplicate feature names: {dup_names}")
                logger.info(f"Missing coordinates: {missing_coords}")
                
                layer_statistics[layer_name]['validation'] = {
                    'invalid_geometries': int(invalid_geoms),
                    'empty_geometries': int(empty_geoms),
                    'duplicate_geometries': int(dup_geoms),
                    'missing_coordinates': int(missing_coords),
                    'duplicate_names': int(dup_names)
                }

        except Exception as e:
            logger.error(f"Error processing layer {layer_name}: {e}")
            import traceback
            traceback.print_exc()

    # Step 3, 5, 6, 7 - Discover Categories, Metro, Restaurants, Healthcare, Public Services
    logger.info("\n" + "="*50)
    logger.info("Discovering Categories across all layers...")
    
    category_mappings = {
        'Restaurant': {'amenity': ['restaurant', 'food_court'], 'shop': ['bakery']},
        'Cafe': {'amenity': ['cafe']},
        'Fast Food': {'amenity': ['fast_food']},
        'Hospital': {'amenity': ['hospital'], 'healthcare': ['hospital']},
        'Clinic/Doctor': {'amenity': ['clinic', 'doctors'], 'healthcare': ['clinic', 'doctor']},
        'Pharmacy': {'amenity': ['pharmacy'], 'healthcare': ['pharmacy']},
        'Blood Bank': {'amenity': ['blood_bank'], 'healthcare': ['blood_bank']},
        'Dentist': {'amenity': ['dentist'], 'healthcare': ['dentist']},
        'ATM': {'amenity': ['atm']},
        'Bank': {'amenity': ['bank']},
        'Police Station': {'amenity': ['police']},
        'Fire Station': {'amenity': ['fire_station']},
        'Post Office': {'amenity': ['post_office']},
        'Metro Station': {'railway': ['station', 'subway'], 'station': ['subway']},
        'Bus Stop': {'highway': ['bus_stop'], 'public_transport': ['platform', 'stop_position']},
        'Fuel Station': {'amenity': ['fuel']},
        'Hotel': {'tourism': ['hotel']},
        'Park': {'leisure': ['park']},
        'Shopping Mall': {'shop': ['mall']},
        'Market': {'amenity': ['marketplace']},
        'Toilet': {'amenity': ['toilets']},
        'Parking': {'amenity': ['parking']},
        'Temple': {'amenity': ['place_of_worship'], 'religion': ['hindu']},
        'Church': {'amenity': ['place_of_worship'], 'religion': ['christian']},
        'Mosque': {'amenity': ['place_of_worship'], 'religion': ['muslim']},
        'Museum': {'tourism': ['museum']},
        'Tourist Attraction': {'tourism': ['attraction']}
    }

    # Gather data across layers
    for cat_name, criteria in category_mappings.items():
        total_count = 0
        samples = []
        for layer_name, gdf in all_gdf.items():
            mask = pd.Series(False, index=gdf.index)
            for col, vals in criteria.items():
                if col in gdf.columns:
                    mask = mask | gdf[col].isin(vals)
            
            count = mask.sum()
            total_count += count
            if count > 0:
                sample_df = gdf[mask].head(3).drop(columns=['geometry'], errors='ignore')
                for _, row in sample_df.iterrows():
                    # Filter out NaN values for cleaner sample output
                    clean_row = {k: v for k, v in row.to_dict().items() if pd.notna(v)}
                    samples.append(clean_row)
        
        categories_summary.append({
            'Category': cat_name,
            'Count': total_count,
            'Samples': json.dumps(samples[:3])
        })
        logger.info(f"Found {total_count} features for category: {cat_name}")

    # Step 4 - Detect Metro Data specifically
    logger.info("\n--- Detecting Metro Data ---")
    metro_keywords = ['railway', 'station', 'public_transport', 'subway', 'metro']
    metro_values = {}
    for layer_name, gdf in all_gdf.items():
        for col in metro_keywords:
            if col in gdf.columns:
                unique_vals = gdf[col].dropna().unique().tolist()
                if unique_vals:
                    if col not in metro_values:
                        metro_values[col] = []
                    metro_values[col].extend(unique_vals)
                    metro_values[col] = list(set(metro_values[col]))

    logger.info(f"Metro related fields found with values:")
    for col, vals in metro_values.items():
        logger.info(f"  {col}: {vals}")

    # Export all summary files
    pd.DataFrame(layers_summary).to_csv(os.path.join(OUTPUT_DIR, 'layers_summary.csv'), index=False)
    pd.DataFrame(columns_summary).to_csv(os.path.join(OUTPUT_DIR, 'columns_summary.csv'), index=False)
    pd.DataFrame(categories_summary).to_csv(os.path.join(OUTPUT_DIR, 'categories_summary.csv'), index=False)

    with open(os.path.join(OUTPUT_DIR, 'layer_statistics.json'), 'w') as f:
        json.dump(layer_statistics, f, indent=4)
        
    with open(os.path.join(OUTPUT_DIR, 'sample_features.json'), 'w') as f:
        json.dump(sample_features, f, indent=4)
        
    with open(os.path.join(OUTPUT_DIR, 'unique_values.json'), 'w') as f:
        json.dump(unique_values, f, indent=4)

    logger.info(f"\nAll analysis reports exported to {OUTPUT_DIR}")

    # Step 10 - Recommendations Report
    recommendations = """
RECOMMENDATIONS REPORT
======================
Based on the analysis of the GeoPackage, here are the recommendations for building the extraction pipeline:

1. Which layer contains Points of Interest (POIs)?
   -> Usually, the 'points' or 'multipolygons' layer contains POIs. Check the layers_summary.csv. OSM data is often split into points, lines, and multipolygons. 'points' layer is the primary source for specific facilities.

2. Which columns identify nearby facilities?
   -> 'amenity', 'shop', 'tourism', 'healthcare', 'leisure', 'railway', 'public_transport' are the primary columns to identify facilities.

3. Which field contains restaurant information?
   -> 'amenity' (values: 'restaurant', 'fast_food', 'food_court', 'cafe').

4. Which field identifies metro stations?
   -> 'railway' (value: 'station', 'subway'), 'station' (value: 'subway'), or 'public_transport' (value: 'station'). Also check the 'name' column for "Metro".

5. Which field identifies hospitals?
   -> 'amenity' (value: 'hospital') or 'healthcare' (value: 'hospital').

6. Which field identifies pharmacies?
   -> 'amenity' (value: 'pharmacy') or 'healthcare' (value: 'pharmacy').

7. Which field identifies police stations?
   -> 'amenity' (value: 'police').

8. Which field identifies ATMs?
   -> 'amenity' (value: 'atm').

9. Which fields should be indexed for fast nearest-neighbour searches?
   -> A spatial index (like an R-tree) on the 'geometry' column is essential. For filtering, index the 'amenity', 'shop', 'healthcare', and 'railway' columns.

10. Which dataset is most suitable for generating the JSON?
   -> The 'points' layer is best for discrete locations (ATMs, restaurants). The 'multipolygons' layer might be needed for large hospitals or malls that are mapped as building footprints rather than points. A combined GeoDataFrame (using centroid of polygons) filtered by the target amenities is the most suitable approach.
"""
    with open(os.path.join(OUTPUT_DIR, 'recommendations.txt'), 'w') as f:
        f.write(recommendations)
    logger.info(recommendations)


if __name__ == "__main__":
    analyze_gpkg(GPKG_PATH)
