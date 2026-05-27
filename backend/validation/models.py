"""
ValidationIssue model — flags on suspicious records.
"""
import uuid
from django.db import models
from normalization.models import EmissionRecord


class ValidationIssue(models.Model):
    """A validation flag attached to an EmissionRecord."""

    class Severity(models.TextChoices):
        ERROR = "error", "Error"
        WARNING = "warning", "Warning"
        INFO = "info", "Info"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emission_record = models.ForeignKey(
        EmissionRecord, on_delete=models.CASCADE, related_name="validation_issues"
    )
    severity = models.CharField(max_length=10, choices=Severity.choices)
    rule_name = models.CharField(
        max_length=100, help_text="Machine-readable rule identifier"
    )
    message = models.TextField(help_text="Human-readable description of the issue")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-severity", "-created_at"]
        indexes = [
            models.Index(fields=["emission_record", "severity"]),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.rule_name}: {self.message}"


class ValidationRule(models.Model):
    """Configurable validation rule for an organization."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE,
        related_name="validation_rules",
    )
    rule_name = models.CharField(max_length=100, help_text="Machine-readable rule identifier")
    display_name = models.CharField(max_length=255, help_text="Human-readable name")
    description = models.TextField(blank=True, default="")
    severity = models.CharField(max_length=10, choices=ValidationIssue.Severity.choices, default="warning")
    is_enabled = models.BooleanField(default=True)
    threshold = models.JSONField(
        default=dict, blank=True,
        help_text="Rule-specific configuration, e.g. {'max_value': 100000}",
    )
    source_types = models.JSONField(
        default=list, blank=True,
        help_text="Which source types this rule applies to, e.g. ['sap', 'utility']",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["organization", "rule_name"]
        ordering = ["rule_name"]

    def __str__(self):
        status = "ON" if self.is_enabled else "OFF"
        return f"[{status}] {self.display_name} ({self.rule_name})"
