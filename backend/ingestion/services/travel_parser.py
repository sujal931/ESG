"""
Corporate Travel CSV Parser Service.

Handles Concur/Navan-style travel exports with flights, hotels,
and ground transport. Uses mock airport distance lookup.
"""
import csv
import io
from typing import List, Dict, Any, Tuple

# Mock airport distance lookup (km) — realistic great-circle estimates
AIRPORT_DISTANCES = {
    ("JFK", "LAX"): 3983, ("LAX", "JFK"): 3983,
    ("JFK", "LHR"): 5539, ("LHR", "JFK"): 5539,
    ("JFK", "SFO"): 4139, ("SFO", "JFK"): 4139,
    ("JFK", "ORD"): 1188, ("ORD", "JFK"): 1188,
    ("JFK", "CDG"): 5834, ("CDG", "JFK"): 5834,
    ("JFK", "FRA"): 6198, ("FRA", "JFK"): 6198,
    ("LAX", "LHR"): 8756, ("LHR", "LAX"): 8756,
    ("LAX", "SFO"): 543, ("SFO", "LAX"): 543,
    ("LAX", "ORD"): 2802, ("ORD", "LAX"): 2802,
    ("ORD", "LHR"): 6352, ("LHR", "ORD"): 6352,
    ("ORD", "SFO"): 2972, ("SFO", "ORD"): 2972,
    ("SFO", "LHR"): 8622, ("LHR", "SFO"): 8622,
    ("LHR", "CDG"): 340, ("CDG", "LHR"): 340,
    ("LHR", "FRA"): 660, ("FRA", "LHR"): 660,
    ("FRA", "CDG"): 450, ("CDG", "FRA"): 450,
    ("SIN", "HKG"): 2581, ("HKG", "SIN"): 2581,
    ("SIN", "LHR"): 10841, ("LHR", "SIN"): 10841,
    ("DXB", "LHR"): 5492, ("LHR", "DXB"): 5492,
    ("DXB", "JFK"): 11005, ("JFK", "DXB"): 11005,
    ("BOM", "LHR"): 7202, ("LHR", "BOM"): 7202,
    ("BOM", "DXB"): 1926, ("DXB", "BOM"): 1926,
    ("DEL", "LHR"): 6712, ("LHR", "DEL"): 6712,
    ("DEL", "DXB"): 2194, ("DXB", "DEL"): 2194,
    ("NRT", "LAX"): 8820, ("LAX", "NRT"): 8820,
    ("NRT", "JFK"): 10838, ("JFK", "NRT"): 10838,
}

VALID_AIRPORT_CODES = set()
for pair in AIRPORT_DISTANCES:
    VALID_AIRPORT_CODES.update(pair)

TRAVEL_CATEGORIES = {"flight", "hotel", "ground transport", "ground_transport", "taxi", "rail", "car_rental"}

# Cabin class emission multipliers (relative to economy)
CABIN_MULTIPLIERS = {
    "economy": 1.0,
    "premium_economy": 1.6,
    "business": 2.9,
    "first": 4.0,
}


def lookup_distance(origin: str, destination: str) -> Tuple[float, bool]:
    """Look up distance between airport codes. Returns (distance_km, found)."""
    if not origin or not destination:
        return None, False
    key = (origin.upper().strip(), destination.upper().strip())
    dist = AIRPORT_DISTANCES.get(key)
    if dist:
        return dist, True
    return None, False


def is_valid_airport(code: str) -> bool:
    if not code:
        return False
    return code.upper().strip() in VALID_AIRPORT_CODES


def parse_travel_csv(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse corporate travel CSV.
    Expected columns vary by category:
      Flight: traveler_name, category, origin_airport, destination_airport,
              cabin_class, distance_km
      Hotel:  traveler_name, category, hotel_nights, city
      Ground: traveler_name, category, taxi_distance, mode
    """
    text = file_content.decode("utf-8-sig")
    delimiter = "," if "," in text.split("\n")[0] else "\t"
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    records = []
    seen_trips = set()

    for row_num, row in enumerate(reader, start=1):
        cleaned = {}
        for k, v in row.items():
            if k is None:
                continue
            cleaned[k.strip().lower().replace(" ", "_")] = (v or "").strip()

        category = cleaned.get("category", "").lower().strip()
        traveler = cleaned.get("traveler_name", cleaned.get("traveler", ""))

        # Duplicate detection
        trip_key = "|".join([traveler, category] + [cleaned.get(c, "") for c in sorted(cleaned.keys())])
        is_duplicate = trip_key in seen_trips
        seen_trips.add(trip_key)

        parsed = {
            "traveler_name": traveler,
            "category": category if category in TRAVEL_CATEGORIES else "unknown",
            "is_duplicate": is_duplicate,
        }

        if category == "flight":
            origin = cleaned.get("origin_airport", cleaned.get("origin", ""))
            dest = cleaned.get("destination_airport", cleaned.get("destination", ""))
            cabin = cleaned.get("cabin_class", "economy").lower().strip()

            distance_raw = cleaned.get("distance_km", cleaned.get("distance", ""))
            try:
                distance = float(distance_raw) if distance_raw else None
            except ValueError:
                distance = None

            # If distance missing, try lookup
            distance_estimated = False
            if distance is None:
                distance, found = lookup_distance(origin, dest)
                distance_estimated = found

            parsed.update({
                "origin_airport": origin.upper() if origin else "",
                "destination_airport": dest.upper() if dest else "",
                "origin_valid": is_valid_airport(origin),
                "destination_valid": is_valid_airport(dest),
                "cabin_class": cabin,
                "cabin_multiplier": CABIN_MULTIPLIERS.get(cabin, 1.0),
                "distance_km": distance,
                "distance_estimated": distance_estimated,
            })

        elif category == "hotel":
            nights_raw = cleaned.get("hotel_nights", cleaned.get("nights", ""))
            try:
                nights = int(nights_raw) if nights_raw else None
            except ValueError:
                nights = None
            parsed.update({
                "hotel_nights": nights,
                "city": cleaned.get("city", cleaned.get("location", "")),
            })

        elif category in ("ground transport", "ground_transport", "taxi"):
            dist_raw = cleaned.get("taxi_distance", cleaned.get("distance_km", cleaned.get("distance", "")))
            try:
                taxi_dist = float(dist_raw) if dist_raw else None
            except ValueError:
                taxi_dist = None
            parsed.update({
                "distance_km": taxi_dist,
                "mode": cleaned.get("mode", cleaned.get("transport_mode", "taxi")),
            })

        record = {
            "row_number": row_num,
            "raw_data": dict(row),
            "parsed": parsed,
        }
        records.append(record)

    return records


def parse_travel_row(raw_data: dict) -> dict:
    """Parse a single travel raw record for reprocessing."""
    cleaned = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_data.items() if k}
    traveler = cleaned.get("traveler_name", cleaned.get("traveler", cleaned.get("name", "Unknown")))
    category = cleaned.get("category", cleaned.get("travel_type", "unknown")).lower().strip()

    parsed = {
        "traveler_name": traveler,
        "category": category if category in TRAVEL_CATEGORIES else "unknown",
        "is_duplicate": False,
    }

    if category == "flight":
        origin = cleaned.get("origin_airport", cleaned.get("origin", ""))
        dest = cleaned.get("destination_airport", cleaned.get("destination", ""))
        cabin = cleaned.get("cabin_class", "economy").lower().strip()

        distance_raw = cleaned.get("distance_km", cleaned.get("distance", ""))
        try:
            distance = float(distance_raw) if distance_raw else None
        except ValueError:
            distance = None

        distance_estimated = False
        if distance is None:
            distance, found = lookup_distance(origin, dest)
            distance_estimated = found

        parsed.update({
            "origin_airport": origin.upper() if origin else "",
            "destination_airport": dest.upper() if dest else "",
            "origin_valid": is_valid_airport(origin),
            "destination_valid": is_valid_airport(dest),
            "cabin_class": cabin,
            "cabin_multiplier": CABIN_MULTIPLIERS.get(cabin, 1.0),
            "distance_km": distance,
            "distance_estimated": distance_estimated,
        })

    elif category == "hotel":
        nights_raw = cleaned.get("hotel_nights", cleaned.get("nights", ""))
        try:
            nights = int(nights_raw) if nights_raw else None
        except ValueError:
            nights = None
        parsed.update({
            "hotel_nights": nights,
            "city": cleaned.get("city", cleaned.get("location", "")),
        })

    elif category in ("ground transport", "ground_transport", "taxi"):
        dist_raw = cleaned.get("taxi_distance", cleaned.get("distance_km", cleaned.get("distance", "")))
        try:
            taxi_dist = float(dist_raw) if dist_raw else None
        except ValueError:
            taxi_dist = None
        parsed.update({
            "distance_km": taxi_dist,
            "mode": cleaned.get("mode", cleaned.get("transport_mode", "taxi")),
        })

    return parsed

