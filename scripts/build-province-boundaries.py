"""Build Nepal's official 2020 province and country outlines.

The input is the Survey Department province polygons published on the National
GeoPortal (https://nationalgeoportal.gov.np), including Lipulekh, Kalapani and
Limpiyadhura. A GeoJSON conversion of those polygons is at
https://github.com/manishacharya60/nepal-geojson/blob/main/Nepal_Administrative_Boundary_Province.geojson

  python3 scripts/build-province-boundaries.py /path/to/provinces.geojson

Writes the files the site loads. The site does not download boundaries at build time.
"""

import json
import sys

from shapely.geometry import Polygon, mapping, shape
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

NAME = {
    1: ("koshi", "Koshi", "NP-P1"),
    2: ("madhesh", "Madhesh", "NP-P2"),
    3: ("bagmati", "Bagmati", "NP-P3"),
    4: ("gandaki", "Gandaki", "NP-P4"),
    5: ("lumbini", "Lumbini", "NP-P5"),
    6: ("karnali", "Karnali", "NP-P6"),
    7: ("sudurpashchim", "Sudurpashchim", "NP-P7"),
}

# About 150 m. Keeps the Limpiyadhura point; full geoportal rings are far larger than the map needs.
TOLERANCE = 0.0015

SOURCE = "Survey Department of Nepal, official political map of 18 May 2020 (Lipulekh, Kalapani, Limpiyadhura), National GeoPortal province polygons, simplified to 0.0015°"
SOURCE_URL = "https://nationalgeoportal.gov.np"
LICENSE = "Survey Department of Nepal"
LICENSE_NOTE = (
    "Province and country outlines follow the Government of Nepal map issued on 18 May 2020, "
    "including the northwest tip at Limpiyadhura. They are the National GeoPortal province polygons "
    "published by the Survey Department, lightly simplified for the web map. "
    "OpenStreetMap admin lines are not drawn."
)


def round_geom(geom):
    def round_coords(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], 5), round(coords[1], 5)]
        return [round_coords(part) for part in coords]

    raw = mapping(geom)
    raw["coordinates"] = round_coords(raw["coordinates"])
    return raw


def main():
    source = json.load(open(sys.argv[1]))
    features = []
    geoms = []
    for feature in source["features"]:
        number = int(feature["properties"]["PROVINCE"])
        slug, name, iso = NAME[number]
        geom = shape(feature["geometry"]).simplify(TOLERANCE, preserve_topology=True)
        if geom.geom_type == "Polygon":
            geom = Polygon(geom.exterior, [hole for hole in geom.interiors if abs(hole.area) > 1e-6])
        geom = orient(geom, sign=1.0)
        geoms.append(geom)
        features.append(
            {
                "type": "Feature",
                "properties": {"slug": slug, "name": name, "iso": iso},
                "geometry": round_geom(geom),
            }
        )

    country = unary_union(geoms)
    if country.geom_type != "Polygon":
        raise SystemExit(f"expected one country polygon, got {country.geom_type}")
    country = orient(Polygon(country.exterior), sign=1.0)
    outline = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Nepal",
                    "year": 2020,
                    "note": "Official boundary including Lipulekh, Kalapani and Limpiyadhura",
                },
                "geometry": round_geom(country),
            }
        ],
    }

    out_dir = "src/data/nepal"
    json.dump(
        {"type": "FeatureCollection", "features": features},
        open(f"{out_dir}/province-boundaries.json", "w"),
        separators=(",", ":"),
    )
    json.dump(outline, open(f"{out_dir}/nepal-outline.geojson", "w"), separators=(",", ":"))

    index_path = f"{out_dir}/province-index.json"
    index = json.load(open(index_path))
    index["source"] = SOURCE
    index["sourceUrl"] = SOURCE_URL
    index["license"] = LICENSE
    index["licenseNote"] = LICENSE_NOTE
    west, south, east, north = country.bounds
    index["nepal"]["bbox"] = [round(west, 4), round(south, 4), round(east, 4), round(north, 4)]
    by_slug = {feature["properties"]["slug"]: shape(feature["geometry"]) for feature in features}
    for province in index["provinces"]:
        geom = by_slug[province["slug"]]
        minx, miny, maxx, maxy = geom.bounds
        province["bbox"] = [round(minx, 4), round(miny, 4), round(maxx, 4), round(maxy, 4)]
    json.dump(index, open(index_path, "w"), indent=2)
    open(index_path, "a").write("\n")

    tip = max(country.exterior.coords, key=lambda point: point[1])
    print(f"wrote {len(features)} provinces; north tip {tip[0]:.4f}, {tip[1]:.4f}")


if __name__ == "__main__":
    main()
