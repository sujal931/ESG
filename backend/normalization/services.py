"""
Normalization Service — maps parsed source data into EmissionRecords.

Each source type has its own normalization logic that maps
messy, source-specific data into the unified EmissionRecord schema.
"""
from datetime import datetime, date
from decimal import Decimal

from normalization.models import EmissionRecord


class NormalizationService:
    """
    Normalizes parsed data from any source into an EmissionRecord.
    Dispatches to source-specific normalization methods.
    """

    def normalize(self, source_type, parsed_data, raw_record, organization, batch):
        """Route to the correct normalizer based on source type."""
        normalizers = {
            "sap": self._normalize_sap,
            "utility": self._normalize_utility,
            "travel": self._normalize_travel,
        }
        normalizer = normalizers.get(source_type)
        if not normalizer:
            raise ValueError(f"No normalizer for source type: {source_type}")
        return normalizer(parsed_data, raw_record, organization, batch)

    def _normalize_sap(self, parsed, raw_record, org, batch):
        """
        SAP normalization:
        - Fuel → Scope 1 (direct combustion)
        - Procurement → Scope 3 (purchased goods)
        """
        category = parsed.get("category", "unknown")
        quantity = parsed.get("quantity")
        normalized_qty = parsed.get("normalized_quantity")
        unit = parsed.get("unit_of_measure", "")
        norm_unit = parsed.get("normalized_unit", "")

        scope = (
            EmissionRecord.Scope.SCOPE_1 if category == "fuel"
            else EmissionRecord.Scope.SCOPE_3
        )

        reporting_date = None
        if parsed.get("posting_date"):
            try:
                reporting_date = datetime.fromisoformat(parsed["posting_date"]).date()
            except (ValueError, TypeError):
                pass

        # If not convertible, mark for review
        status = EmissionRecord.Status.PENDING
        if not parsed.get("unit_convertible"):
            status = EmissionRecord.Status.NEEDS_REVIEW

        return EmissionRecord.objects.create(
            organization=org,
            raw_record=raw_record,
            upload_batch=batch,
            source_type=EmissionRecord.SourceType.SAP,
            scope=scope,
            category=category,
            activity_value=Decimal(str(quantity)) if quantity is not None else None,
            activity_unit=unit,
            normalized_value=(
                Decimal(str(normalized_qty)) if normalized_qty is not None else None
            ),
            normalized_unit=norm_unit if norm_unit != "unknown" else "",
            reporting_date=reporting_date,
            description=f"SAP {category} — Material {parsed.get('material_number', 'N/A')}",
            metadata={
                "company_code": parsed.get("company_code"),
                "plant_code": parsed.get("plant_code"),
                "material_number": parsed.get("material_number"),
                "amount_local_currency": parsed.get("amount"),
                "conversion_factor": parsed.get("conversion_factor"),
            },
            status=status,
        )

    def _normalize_utility(self, parsed, raw_record, org, batch):
        """
        Utility normalization:
        - Electricity → Scope 2 (purchased electricity)
        """
        kwh = parsed.get("kwh")
        normalized_kwh = parsed.get("normalized_kwh")

        reporting_date = None
        if parsed.get("billing_end"):
            try:
                reporting_date = datetime.fromisoformat(parsed["billing_end"]).date()
            except (ValueError, TypeError):
                pass

        status = EmissionRecord.Status.PENDING
        if parsed.get("is_duplicate"):
            status = EmissionRecord.Status.NEEDS_REVIEW

        return EmissionRecord.objects.create(
            organization=org,
            raw_record=raw_record,
            upload_batch=batch,
            source_type=EmissionRecord.SourceType.UTILITY,
            scope=EmissionRecord.Scope.SCOPE_2,
            category="electricity",
            activity_value=Decimal(str(kwh)) if kwh is not None else None,
            activity_unit=parsed.get("unit", "kWh"),
            normalized_value=(
                Decimal(str(normalized_kwh)) if normalized_kwh is not None else None
            ),
            normalized_unit="kWh",
            reporting_date=reporting_date,
            description=f"Utility — Meter {parsed.get('meter_id', 'N/A')}",
            metadata={
                "meter_id": parsed.get("meter_id"),
                "billing_start": parsed.get("billing_start"),
                "billing_end": parsed.get("billing_end"),
                "tariff": parsed.get("tariff"),
                "cost": parsed.get("cost"),
                "is_duplicate": parsed.get("is_duplicate"),
            },
            status=status,
        )

    def _normalize_travel(self, parsed, raw_record, org, batch):
        """
        Travel normalization:
        - Flight → Scope 3 (business travel)
        - Hotel → Scope 3 (business travel)
        - Ground transport → Scope 3 (business travel)
        """
        category = parsed.get("category", "unknown")

        if category == "flight":
            activity_value = parsed.get("distance_km")
            activity_unit = "km"
            # Apply cabin class multiplier for weighted distance
            multiplier = parsed.get("cabin_multiplier", 1.0)
            normalized_value = (
                activity_value * multiplier if activity_value else None
            )
            description = (
                f"Flight {parsed.get('origin_airport', '?')} → "
                f"{parsed.get('destination_airport', '?')} "
                f"({parsed.get('cabin_class', 'economy')})"
            )
        elif category == "hotel":
            activity_value = parsed.get("hotel_nights")
            activity_unit = "nights"
            normalized_value = activity_value
            description = f"Hotel stay — {parsed.get('city', 'N/A')}"
        else:
            activity_value = parsed.get("distance_km")
            activity_unit = "km"
            normalized_value = activity_value
            description = f"Ground transport — {parsed.get('mode', 'taxi')}"

        status = EmissionRecord.Status.PENDING
        if parsed.get("is_duplicate"):
            status = EmissionRecord.Status.NEEDS_REVIEW

        return EmissionRecord.objects.create(
            organization=org,
            raw_record=raw_record,
            upload_batch=batch,
            source_type=EmissionRecord.SourceType.TRAVEL,
            scope=EmissionRecord.Scope.SCOPE_3,
            category=category,
            activity_value=(
                Decimal(str(activity_value)) if activity_value is not None else None
            ),
            activity_unit=activity_unit,
            normalized_value=(
                Decimal(str(normalized_value)) if normalized_value is not None else None
            ),
            normalized_unit=activity_unit,
            reporting_date=None,
            description=description,
            metadata={k: v for k, v in parsed.items() if k != "is_duplicate"},
            status=status,
        )
