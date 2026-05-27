"""
EmissionRecord — the unified, normalized data model.

All source data (SAP, Utility, Travel) gets normalized into this structure.
This is the primary record analysts review and approve.
"""
import uuid
from django.db import models
from organizations.models import Organization
from ingestion.models import RawRecord, UploadBatch


class EmissionRecord(models.Model):
    """Unified emission record after normalization."""

    class Scope(models.TextChoices):
        SCOPE_1 = "scope_1", "Scope 1 — Direct"
        SCOPE_2 = "scope_2", "Scope 2 — Indirect (Energy)"
        SCOPE_3 = "scope_3", "Scope 3 — Indirect (Value Chain)"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        NEEDS_REVIEW = "needs_review", "Needs Review"

    class SourceType(models.TextChoices):
        SAP = "sap", "SAP"
        UTILITY = "utility", "Utility"
        TRAVEL = "travel", "Travel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="emission_records"
    )
    raw_record = models.OneToOneField(
        RawRecord, on_delete=models.CASCADE, related_name="emission_record",
        null=True, blank=True,
    )
    upload_batch = models.ForeignKey(
        UploadBatch, on_delete=models.CASCADE, related_name="emission_records",
        null=True, blank=True,
    )

    # Classification
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    scope = models.CharField(max_length=10, choices=Scope.choices)
    category = models.CharField(max_length=100)

    # Measured values
    activity_value = models.DecimalField(
        max_digits=16, decimal_places=4, null=True, blank=True,
        help_text="Original measured value",
    )
    activity_unit = models.CharField(max_length=50, blank=True, default="")

    # Normalized values
    normalized_value = models.DecimalField(
        max_digits=16, decimal_places=4, null=True, blank=True,
        help_text="Value after unit normalization",
    )
    normalized_unit = models.CharField(max_length=50, blank=True, default="")

    # Metadata
    reporting_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default="")
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text="Additional source-specific data",
    )

    # Workflow
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    is_locked = models.BooleanField(
        default=False,
        help_text="Locked records cannot be edited or have status changed.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "source_type"]),
            models.Index(fields=["organization", "scope"]),
            models.Index(fields=["reporting_date"]),
        ]

    def __str__(self):
        return (
            f"{self.get_source_type_display()} | {self.category} | "
            f"{self.activity_value} {self.activity_unit} | {self.status}"
        )
