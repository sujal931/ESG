"""
Ingestion models — raw data storage.

DataSource: registered source systems (SAP, Utility, Travel)
UploadBatch: one CSV upload event
RawRecord: individual rows from the CSV, stored verbatim
"""
import uuid
from django.db import models
from organizations.models import Organization, User


class DataSource(models.Model):
    """A registered data source (e.g. SAP, Utility Portal, Travel System)."""

    class SourceType(models.TextChoices):
        SAP = "sap", "SAP Fuel & Procurement"
        UTILITY = "utility", "Utility Electricity"
        TRAVEL = "travel", "Corporate Travel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="data_sources"
    )
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["organization", "source_type"]
        ordering = ["source_type"]

    def __str__(self):
        return f"{self.organization.name} — {self.get_source_type_display()}"


class UploadBatch(models.Model):
    """One CSV upload event. Groups raw records together."""

    class Status(models.TextChoices):
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        PARTIAL = "partial", "Partially Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="upload_batches"
    )
    data_source = models.ForeignKey(
        DataSource, on_delete=models.CASCADE, related_name="batches"
    )
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="uploads"
    )
    file_name = models.CharField(max_length=500)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PROCESSING
    )
    total_rows = models.PositiveIntegerField(default=0)
    processed_rows = models.PositiveIntegerField(default=0)
    error_rows = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Batch {self.id} — {self.file_name}"


class RawRecord(models.Model):
    """
    A single row from an uploaded CSV, stored as raw JSON.
    Preserves the exact original data for audit purposes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="raw_records"
    )
    upload_batch = models.ForeignKey(
        UploadBatch, on_delete=models.CASCADE, related_name="raw_records"
    )
    row_number = models.PositiveIntegerField()
    raw_data = models.JSONField(help_text="Original CSV row as key-value pairs")
    is_valid = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["upload_batch", "row_number"]
        indexes = [
            models.Index(fields=["upload_batch", "row_number"]),
        ]

    def __str__(self):
        return f"Row {self.row_number} of Batch {self.upload_batch_id}"
