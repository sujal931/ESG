"""
Utility Electricity CSV Parser Service.

Handles electricity billing data with variable billing periods,
duplicates, and unit inconsistencies.
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Tuple

DATE_FORMATS = [
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%d-%m-%Y",
    "%m-%d-%Y",
]

# kWh conversion factors
ENERGY_UNIT_CONVERSIONS = {
    "kwh": 1.0,
    "kWh": 1.0,
    "KWH": 1.0,
    "mwh": 1000.0,
    "MWh": 1000.0,
    "MWH": 1000.0,
    "gwh": 1_000_000.0,
    "GWh": 1_000_000.0,
    "wh": 0.001,
    "Wh": 0.001,
}


def parse_date(raw: str) -> Tuple[datetime, bool]:
    if not raw or not raw.strip():
        return None, False
    cleaned = raw.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt), True
        except ValueError:
            continue
    return None, False


def parse_utility_csv(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse utility electricity CSV.
    Expected columns: meter_id, billing_start, billing_end, kwh, tariff, cost
    Also handles: unit, usage (alternative column names)
    """
    text = file_content.decode("utf-8-sig")

    first_line = text.split("\n")[0]
    delimiter = "," if "," in first_line else "\t"

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    records = []
    seen_bills = set()  # for duplicate detection

    for row_num, row in enumerate(reader, start=1):
        # Normalize column names (lowercase, strip)
        cleaned = {}
        for k, v in row.items():
            if k is None:
                continue
            cleaned[k.strip().lower().replace(" ", "_")] = (v or "").strip()

        meter_id = cleaned.get("meter_id", cleaned.get("meter", ""))
        billing_start_raw = cleaned.get("billing_start", cleaned.get("start_date", ""))
        billing_end_raw = cleaned.get("billing_end", cleaned.get("end_date", ""))
        kwh_raw = cleaned.get("kwh", cleaned.get("usage", cleaned.get("consumption", "")))
        unit_raw = cleaned.get("unit", "kWh")
        tariff = cleaned.get("tariff", cleaned.get("rate", ""))
        cost_raw = cleaned.get("cost", cleaned.get("amount", cleaned.get("total", "")))

        # Parse dates
        billing_start, start_ok = parse_date(billing_start_raw)
        billing_end, end_ok = parse_date(billing_end_raw)

        # Parse kWh
        try:
            kwh_value = float(kwh_raw.replace(",", "")) if kwh_raw else None
            kwh_ok = kwh_value is not None
        except (ValueError, TypeError):
            kwh_value = None
            kwh_ok = False

        # Parse cost
        try:
            cost_value = float(cost_raw.replace(",", "").replace("$", "").replace("€", "")) if cost_raw else None
        except (ValueError, TypeError):
            cost_value = None

        # Normalize units to kWh
        conv_factor = ENERGY_UNIT_CONVERSIONS.get(unit_raw, None)
        normalized_kwh = kwh_value * conv_factor if kwh_ok and conv_factor else kwh_value

        # Duplicate detection key
        bill_key = f"{meter_id}|{billing_start_raw}|{billing_end_raw}|{kwh_raw}"
        is_duplicate = bill_key in seen_bills
        seen_bills.add(bill_key)

        record = {
            "row_number": row_num,
            "raw_data": dict(row),
            "parsed": {
                "meter_id": meter_id,
                "billing_start": billing_start.isoformat() if billing_start else None,
                "billing_end": billing_end.isoformat() if billing_end else None,
                "billing_start_parsed": start_ok,
                "billing_end_parsed": end_ok,
                "kwh": kwh_value,
                "kwh_parsed": kwh_ok,
                "unit": unit_raw,
                "tariff": tariff,
                "cost": cost_value,
                "normalized_kwh": normalized_kwh,
                "conversion_factor": conv_factor,
                "is_duplicate": is_duplicate,
            },
        }
        records.append(record)

    return records


def parse_utility_row(raw_data: dict) -> dict:
    """Parse a single utility raw record for reprocessing."""
    meter_id = (raw_data.get("meter_id") or "").strip()
    billing_start, start_ok = parse_date(raw_data.get("billing_start", ""))
    billing_end, end_ok = parse_date(raw_data.get("billing_end", ""))

    kwh_raw = (raw_data.get("kwh") or "").strip()
    try:
        kwh_value = float(kwh_raw.replace(",", ""))
        kwh_ok = True
    except (ValueError, TypeError):
        kwh_value = None
        kwh_ok = False

    unit_raw = (raw_data.get("unit") or raw_data.get("energy_unit") or "kWh").strip()
    conv_factor = ENERGY_UNIT_CONVERSIONS.get(unit_raw, 1.0)
    normalized_kwh = kwh_value * conv_factor if kwh_ok else None

    tariff = (raw_data.get("tariff") or "").strip()
    cost_raw = (raw_data.get("cost") or "").strip()
    try:
        cost_value = float(cost_raw.replace(",", ""))
    except (ValueError, TypeError):
        cost_value = None

    return {
        "meter_id": meter_id,
        "billing_start": billing_start.isoformat() if billing_start else None,
        "billing_end": billing_end.isoformat() if billing_end else None,
        "billing_start_parsed": start_ok,
        "billing_end_parsed": end_ok,
        "kwh": kwh_value,
        "kwh_parsed": kwh_ok,
        "unit": unit_raw,
        "tariff": tariff,
        "cost": cost_value,
        "normalized_kwh": normalized_kwh,
        "conversion_factor": conv_factor,
        "is_duplicate": False,
    }

