"""
Ingestion orchestrator — coordinates parsing, raw record creation,
normalization, and validation for a CSV upload.
"""
from django.db import transaction

from ingestion.models import DataSource, UploadBatch, RawRecord
from normalization.services import NormalizationService
from validation.services import ValidationService
from audit.services import AuditService

from .sap_parser import parse_sap_csv
from .utility_parser import parse_utility_csv
from .travel_parser import parse_travel_csv

PARSERS = {
    DataSource.SourceType.SAP: parse_sap_csv,
    DataSource.SourceType.UTILITY: parse_utility_csv,
    DataSource.SourceType.TRAVEL: parse_travel_csv,
}


class IngestionService:
    """
    Orchestrates the full ingestion pipeline:
    1. Parse CSV into structured records
    2. Store raw records
    3. Normalize into EmissionRecords
    4. Run validation rules
    5. Create audit trail
    """

    def __init__(self, user):
        self.user = user
        self.organization = user.organization
        self.normalizer = NormalizationService()
        self.validator = ValidationService()

    def get_or_create_data_source(self, source_type: str) -> DataSource:
        """Get or create a DataSource for this org and source type."""
        source, _ = DataSource.objects.get_or_create(
            organization=self.organization,
            source_type=source_type,
            defaults={
                "name": dict(DataSource.SourceType.choices).get(source_type, source_type),
            },
        )
        return source

    @transaction.atomic
    def ingest_csv(self, source_type: str, file_obj) -> UploadBatch:
        """
        Main entry point: ingest a CSV file.
        Returns the UploadBatch with processing results.
        """
        parser = PARSERS.get(source_type)
        if not parser:
            raise ValueError(f"Unsupported source type: {source_type}")

        data_source = self.get_or_create_data_source(source_type)
        file_content = file_obj.read()

        # Create batch record
        batch = UploadBatch.objects.create(
            organization=self.organization,
            data_source=data_source,
            uploaded_by=self.user,
            file_name=getattr(file_obj, "name", "unknown.csv"),
            file_size=len(file_content),
            status=UploadBatch.Status.PROCESSING,
        )

        # Audit: upload started
        AuditService.log(
            actor=self.user,
            action="upload_started",
            entity_type="UploadBatch",
            entity_id=str(batch.id),
            new_value={"file_name": batch.file_name, "source_type": source_type},
        )

        try:
            # Parse CSV
            parsed_records = parser(file_content)
            batch.total_rows = len(parsed_records)

            processed = 0
            errors = 0

            for record_data in parsed_records:
                # Store raw record
                raw_record = RawRecord.objects.create(
                    organization=self.organization,
                    upload_batch=batch,
                    row_number=record_data["row_number"],
                    raw_data=record_data["raw_data"],
                )

                try:
                    # Normalize
                    emission_record = self.normalizer.normalize(
                        source_type=source_type,
                        parsed_data=record_data["parsed"],
                        raw_record=raw_record,
                        organization=self.organization,
                        batch=batch,
                    )

                    # Validate
                    self.validator.validate(emission_record, source_type)

                    processed += 1
                except Exception as e:
                    raw_record.is_valid = False
                    raw_record.error_message = str(e)
                    raw_record.save()
                    errors += 1

            batch.processed_rows = processed
            batch.error_rows = errors
            batch.status = (
                UploadBatch.Status.COMPLETED if errors == 0
                else UploadBatch.Status.PARTIAL if processed > 0
                else UploadBatch.Status.FAILED
            )
            batch.save()

            # Audit: upload completed
            AuditService.log(
                actor=self.user,
                action="upload_completed",
                entity_type="UploadBatch",
                entity_id=str(batch.id),
                new_value={
                    "total_rows": batch.total_rows,
                    "processed_rows": processed,
                    "error_rows": errors,
                    "status": batch.status,
                },
            )

        except Exception as e:
            batch.status = UploadBatch.Status.FAILED
            batch.error_message = str(e)
            batch.save()

            AuditService.log(
                actor=self.user,
                action="upload_failed",
                entity_type="UploadBatch",
                entity_id=str(batch.id),
                new_value={"error": str(e)},
            )
            raise

        return batch
