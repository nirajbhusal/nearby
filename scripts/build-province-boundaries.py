"""Rebuild province outlines from geoBoundaries NPL ADM1.

Download the gbOpen simplified GeoJSON (CC BY 3.0 IGO) and run:

  python3 scripts/build-province-boundaries.py /path/to/geoBoundaries-NPL-ADM1_simplified.geojson

The committed files are the output. The site does not download boundaries at build time.
"""

import json
import math
import sys

NAME = {
    "NP-P1": ("koshi", "Koshi"),
    "NP-P2": ("madhesh", "Madhesh"),
    "NP-P3": ("bagmati", "Bagmati"),
    "NP-P4": ("gandaki", "Gandaki"),
    "NP-P5": ("lumbini", "Lumbini"),
    "NP-P6": ("karnali", "Karnali"),
    "NP-P7": ("sudurpashchim", "Sudurpashchim"),
}


def douglas_peucker(points, epsilon):
    if len(points) < 3:
        return points[:]

    def rec(pts):
        if len(pts) < 3:
            return pts
        ax, ay = pts[0]
        bx, by = pts[-1]
        dx, dy = bx - ax, by - ay
        den = math.hypot(dx, dy)
        if den < 1e-12:
            return [pts[0], pts[-1]]
        best = 0
        idx = 0
        for i in range(1, len(pts) - 1):
            px, py = pts[i]
            distance = abs(dy * px - dx * py + bx * ay - by * ax) / den
            if distance > best:
                best = distance
                idx = i
        if best > epsilon:
            left = rec(pts[: idx + 1])
            right = rec(pts[idx:])
            return left[:-1] + right
        return [pts[0], pts[-1]]

    return rec(points)


def simplify_ring(ring, epsilon):
    open_pts = ring[:-1] if ring[0] == ring[-1] else ring[:]
    simplified = douglas_peucker(open_pts, epsilon)
    cleaned = [simplified[0]]
    for point in simplified[1:]:
        if math.hypot(point[0] - cleaned[-1][0], point[1] - cleaned[-1][1]) > 0.003:
            cleaned.append(point)
    if cleaned[0] != cleaned[-1]:
        cleaned.append(cleaned[0])
    return [[round(point[0], 4), round(point[1], 4)] for point in cleaned]


def main():
    source = json.load(open(sys.argv[1]))
    features = []
    provinces = []
    for feature in source["features"]:
        iso = feature["properties"]["shapeISO"]
        slug, name = NAME[iso]
        rings = [simplify_ring(ring, 0.015) for ring in feature["geometry"]["coordinates"]]
        rings = [ring for index, ring in enumerate(rings) if index == 0 or len(ring) > 8]
        xs = [point[0] for point in rings[0]]
        ys = [point[1] for point in rings[0]]
        features.append(
            {
                "type": "Feature",
                "properties": {"slug": slug, "name": name, "iso": iso},
                "geometry": {"type": "Polygon", "coordinates": rings},
            }
        )
        provinces.append(
            {
                "slug": slug,
                "name": name,
                "iso": iso,
                "bbox": [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)],
            }
        )
    out_dir = "src/data/nepal"
    json.dump(
        {"type": "FeatureCollection", "features": features},
        open(f"{out_dir}/province-boundaries.json", "w"),
        separators=(",", ":"),
    )
    print(f"wrote {len(features)} provinces")


if __name__ == "__main__":
    main()
