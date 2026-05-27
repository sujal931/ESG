"""
Validation Service — rule-based validation engine.

Runs a set of validation rules against EmissionRecords and creates
ValidationIssue entries for any flagged records.
"""
from decimal import Decimal

from normalization.models import EmissionRecord
from validation.models import ValidationIssue

# Thresholds
MAX_ELECTRICITY_KWH = Decimal("500000")  # 500,000 kWh is suspicious for a single bill
MAX_FUEL_LITERS = Decimal("100000")      # 100,000 liters
MAX_FLIGHT_DISTANCE = Decimal("20000")   # longest flight ~18,000 km


class ValidationService:
    """Runs all applicable validation rules on an EmissionRecord."""

    def validate(self, record: EmissionRecord, source_type: str):
        """Run all rules and create ValidationIssue entries."""
        issues = []

        # Universal rules
        issues.extend(self._check_negative_values(record))
        issues.extend(self._check_missing_values(record))

        # Source-specific rules
        if source_type == "sap":
            issues.extend(self._check_sap_rules(record))
        elif source_type == "utility":
            issues.extend(self._check_utility_rules(record))
        elif source_type == "travel":
            issues.extend(self._check_travel_rules(record))

        # If any errors found, mark record for review
        if any(i.severity == ValidationIssue.Severity.ERROR for i in issues):
            record.status = EmissionRecord.Status.NEEDS_REVIEW
            record.save(update_fields=["status"])

        return issues

    def _create_issue(self, record, severity, rule_name, message):
        """Create and return a ValidationIssue."""
        return ValidationIssue.objects.create(
            emission_record=record,
            severity=severity,
            rule_name=rule_name,
            message=message,
        )

    # ── Universal Rules ──────────────────────────────────────────────

    def _check_negative_values(self, record):
        issues = []
        if record.activity_value is not None and record.activity_value < 0:
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "negative_activity_value",
                f"Activity value is negative: {record.activity_value} {record.activity_unit}",
            ))
        if record.normalized_value is not None and record.normalized_value < 0:
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "negative_normalized_value",
                f"Normalized value is negative: {record.normalized_value}",
            ))
        return issues

    def _check_missing_values(self, record):
        issues = []
        if record.activity_value is None:
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.WARNING,
                "missing_activity_value",
                "Activity value is missing. Record may be incomplete.",
            ))
        if not record.activity_unit:
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.WARNING,
                "missing_activity_unit",
                "Activity unit is missing.",
            ))
        return issues

    # ── SAP Rules ────────────────────────────────────────────────────

    def _check_sap_rules(self, record):
        issues = []
        meta = record.metadata or {}

        # Unknown unit
        if not record.normalized_value and record.activity_value:
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.WARNING,
                "sap_unknown_unit",
                f"Unit '{record.activity_unit}' could not be normalized. Manual review needed.",
            ))

        # Missing plant code
        if not meta.get("plant_code"):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.INFO,
                "sap_missing_plant_code",
                "Plant code (WERKS) is missing.",
            ))

        # Extremely high fuel quantity
        if (record.activity_value and record.category == "fuel"
                and record.activity_value > MAX_FUEL_LITERS):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "sap_extreme_fuel_quantity",
                f"Fuel quantity {record.activity_value} {record.activity_unit} "
                f"exceeds threshold of {MAX_FUEL_LITERS}.",
            ))

        return issues

    # ── Utility Rules ────────────────────────────────────────────────

    def _check_utility_rules(self, record):
        issues = []
        meta = record.metadata or {}

        # Missing meter ID
        if not meta.get("meter_id"):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.WARNING,
                "utility_missing_meter_id",
                "Meter ID is missing.",
            ))

        # Extremely high electricity usage
        if (record.normalized_value and
                record.normalized_value > MAX_ELECTRICITY_KWH):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "utility_extreme_usage",
                f"Electricity usage {record.normalized_value} kWh "
                f"exceeds threshold of {MAX_ELECTRICITY_KWH} kWh.",
            ))

        # Duplicate bill flag
        if meta.get("is_duplicate"):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "utility_duplicate_bill",
                "This bill appears to be a duplicate based on meter ID, dates, and usage.",
            ))

        return issues

    # ── Travel Rules ─────────────────────────────────────────────────

    def _check_travel_rules(self, record):
        issues = []
        meta = record.metadata or {}

        if record.category == "flight":
            # Invalid airport codes
            if not meta.get("origin_valid"):
                issues.append(self._create_issue(
                    record,
                    ValidationIssue.Severity.WARNING,
                    "travel_invalid_origin_airport",
                    f"Origin airport '{meta.get('origin_airport', '')}' "
                    f"is not in the known airport database.",
                ))
            if not meta.get("destination_valid"):
                issues.append(self._create_issue(
                    record,
                    ValidationIssue.Severity.WARNING,
                    "travel_invalid_destination_airport",
                    f"Destination airport '{meta.get('destination_airport', '')}' "
                    f"is not in the known airport database.",
                ))

            # Missing distance
            if not record.activity_value:
                issues.append(self._create_issue(
                    record,
                    ValidationIssue.Severity.WARNING,
                    "travel_missing_distance",
                    "Flight distance could not be determined.",
                ))

            # Unrealistic distance
            if (record.activity_value and
                    record.activity_value > MAX_FLIGHT_DISTANCE):
                issues.append(self._create_issue(
                    record,
                    ValidationIssue.Severity.ERROR,
                    "travel_extreme_distance",
                    f"Flight distance {record.activity_value} km exceeds maximum "
                    f"realistic distance of {MAX_FLIGHT_DISTANCE} km.",
                ))

        # Duplicate trip
        if meta.get("is_duplicate"):
            issues.append(self._create_issue(
                record,
                ValidationIssue.Severity.ERROR,
                "travel_duplicate_trip",
                "This trip appears to be a duplicate.",
            ))

        return issues
