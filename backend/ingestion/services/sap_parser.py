"""
SAP CSV Parser Service.

Handles messy SAP exports with German column names, inconsistent dates,
and varied unit formats.

SAP Column Mapping:
  BUKRS  → company_code
  WERKS  → plant_code
  MATNR  → material_number
  MENGE  → quantity
  MEINS  → unit_of_measure
  BUDAT  → posting_date
  DMBTR  → amount_local_currency
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Tuple

# SAP German column name mapping
SAP_COLUMN_MAP = {
    "BUKRS": "company_code",
    "WERKS": "plant_code",
    "MATNR": "material_number",
    "MENGE": "quantity",
    "MEINS": "unit_of_measure",
    "BUDAT": "posting_date",
    "DMBTR": "amount_local_currency",
    # Sometimes SAP exports use slightly different names
    "Bukrs": "company_code",
    "Werks": "plant_code",
    "Matnr": "material_number",
    "Menge": "quantity",
    "Meins": "unit_of_measure",
    "Budat": "posting_date",
    "Dmbtr": "amount_local_currency",
}

# Material categories for scope classification
FUEL_MATERIALS = {
    "DIESEL", "PETROL", "GASOLINE", "LPG", "NATURAL_GAS", "FUEL_OIL",
    "diesel", "petrol", "gasoline", "lpg", "natural_gas", "fuel_oil",
    "DSL", "PET", "GAS", "NGAS", "FOIL",
}

# Unit normalization: convert everything to liters
UNIT_CONVERSIONS = {
    "L": 1.0,
    "LTR": 1.0,
    "l": 1.0,
    "ltr": 1.0,
    "liters": 1.0,
    "litres": 1.0,
    "GAL": 3.78541,
    "gal": 3.78541,
    "gallons": 3.78541,
    "KG": None,  # needs density-based conversion, flag for review
    "kg": None,
    "M3": 1000.0,
    "m3": 1000.0,
    "MT": None,  # metric tonnes, needs material-specific conversion
}

# Known date formats in SAP exports
DATE_FORMATS = [
    "%Y%m%d",       # 20240115
    "%d.%m.%Y",     # 15.01.2024
    "%Y-%m-%d",     # 2024-01-15
    "%d/%m/%Y",     # 15/01/2024
    "%m/%d/%Y",     # 01/15/2024
    "%Y.%m.%d",     # 2024.01.15
]


def parse_sap_date(raw_date: str) -> Tuple[datetime, bool]:
    """
    Attempt to parse a date string against known SAP formats.
    Returns (parsed_date, success).
    """
    if not raw_date or not raw_date.strip():
        return None, False

    cleaned = raw_date.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt), True
        except ValueError:
            continue
    return None, False


def classify_material(material_number: str) -> str:
    """Classify SAP material into a category."""
    if not material_number:
        return "unknown"
    upper = material_number.upper().strip()
    if any(fuel in upper for fuel in FUEL_MATERIALS):
        return "fuel"
    return "procurement"


def normalize_unit(unit: str) -> Tuple[float, str, bool]:
    """
    Return (conversion_factor, normalized_unit, is_convertible).
    If not convertible, factor is None.
    """
    if not unit:
        return None, "unknown", False
    cleaned = unit.strip()
    factor = UNIT_CONVERSIONS.get(cleaned)
    if factor is not None:
        return factor, "L", True
    if cleaned in UNIT_CONVERSIONS:
        # Key exists but factor is None (e.g., KG needs density)
        return None, cleaned, False
    return None, "unknown", False


def parse_quantity(raw_value: str) -> Tuple[float, bool]:
    """Parse a quantity that may use comma as decimal separator."""
    if not raw_value:
        return None, False
    try:
        # Handle German number format: 1.234,56 → 1234.56
        cleaned = raw_value.strip().replace(".", "").replace(",", ".")
        return float(cleaned), True
    except (ValueError, TypeError):
        return None, False


def parse_sap_csv(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse a SAP CSV export into a list of raw record dicts.
    Handles BOM, various delimiters, and messy formatting.
    """
    # Decode, handling BOM
    text = file_content.decode("utf-8-sig")

    # Try to detect delimiter
    first_line = text.split("\n")[0]
    if "\t" in first_line:
        delimiter = "\t"
    elif ";" in first_line:
        delimiter = ";"
    else:
        delimiter = ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    records = []

    for row_num, row in enumerate(reader, start=1):
        # Map German column names to English
        mapped = {}
        for key, value in row.items():
            if key is None:
                continue
            clean_key = key.strip()
            mapped_key = SAP_COLUMN_MAP.get(clean_key, clean_key)
            mapped[mapped_key] = value.strip() if value else ""

        # Parse and enrich
        quantity, qty_ok = parse_quantity(mapped.get("quantity", ""))
        posting_date, date_ok = parse_sap_date(mapped.get("posting_date", ""))
        category = classify_material(mapped.get("material_number", ""))
        unit = mapped.get("unit_of_measure", "")
        conv_factor, norm_unit, unit_ok = normalize_unit(unit)

        record = {
            "row_number": row_num,
            "raw_data": dict(row),  # preserve original
            "parsed": {
                "company_code": mapped.get("company_code", ""),
                "plant_code": mapped.get("plant_code", ""),
                "material_number": mapped.get("material_number", ""),
                "quantity": quantity,
                "quantity_parsed": qty_ok,
                "unit_of_measure": unit,
                "posting_date": posting_date.isoformat() if posting_date else None,
                "date_parsed": date_ok,
                "amount": mapped.get("amount_local_currency", ""),
                "category": category,
                "conversion_factor": conv_factor,
                "normalized_unit": norm_unit,
                "unit_convertible": unit_ok,
                "normalized_quantity": (
                    quantity * conv_factor if qty_ok and conv_factor else None
                ),
            },
        }
        records.append(record)

    return records


def parse_sap_row(raw_data: dict) -> dict:
    """
    Parse a single SAP raw record dict (from RawRecord.raw_data)
    into the parsed format expected by the normalizer.
    Used for reprocessing failed rows.
    """
    mapped = {}
    for key, value in raw_data.items():
        if key is None:
            continue
        clean_key = key.strip()
        mapped_key = SAP_COLUMN_MAP.get(clean_key, clean_key)
        mapped[mapped_key] = value.strip() if value else ""

    quantity, qty_ok = parse_quantity(mapped.get("quantity", ""))
    posting_date, date_ok = parse_sap_date(mapped.get("posting_date", ""))
    category = classify_material(mapped.get("material_number", ""))
    unit = mapped.get("unit_of_measure", "")
    conv_factor, norm_unit, unit_ok = normalize_unit(unit)

    return {
        "company_code": mapped.get("company_code", ""),
        "plant_code": mapped.get("plant_code", ""),
        "material_number": mapped.get("material_number", ""),
        "quantity": quantity,
        "quantity_parsed": qty_ok,
        "unit_of_measure": unit,
        "posting_date": posting_date.isoformat() if posting_date else None,
        "date_parsed": date_ok,
        "amount": mapped.get("amount_local_currency", ""),
        "category": category,
        "conversion_factor": conv_factor,
        "normalized_unit": norm_unit,
        "unit_convertible": unit_ok,
        "normalized_quantity": (
            quantity * conv_factor if qty_ok and conv_factor else None
        ),
    }

