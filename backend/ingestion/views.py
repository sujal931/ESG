from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from organizations.permissions import IsAdmin
from audit.services import AuditService
from .models import UploadBatch, RawRecord
from .serializers import (
    UploadBatchSerializer,
    RawRecordSerializer,
    FileUploadSerializer,
)
from .services.ingestion_service import IngestionService


class UploadCSVView(APIView):
    """
    POST /api/ingestion/upload/
    Upload a CSV file for ingestion.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_type = serializer.validated_data["source_type"]
        file_obj = serializer.validated_data["file"]

        # Validate file type
        if not file_obj.name.lower().endswith(".csv"):
            return Response(
                {"error": "Only CSV files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = IngestionService(user=request.user)
        try:
            batch = service.ingest_csv(source_type=source_type, file_obj=file_obj)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            UploadBatchSerializer(batch).data,
            status=status.HTTP_201_CREATED,
        )


class UploadBatchListView(generics.ListAPIView):
    """
    GET /api/ingestion/batches/
    List upload batches for the current organization.
    """
    serializer_class = UploadBatchSerializer

    def get_queryset(self):
        return UploadBatch.objects.filter(
            organization=self.request.user.organization
        ).select_related("data_source", "uploaded_by")


class UploadBatchDetailView(generics.RetrieveAPIView):
    """
    GET /api/ingestion/batches/<id>/
    """
    serializer_class = UploadBatchSerializer

    def get_queryset(self):
        return UploadBatch.objects.filter(
            organization=self.request.user.organization
        ).select_related("data_source", "uploaded_by")


class RawRecordListView(generics.ListAPIView):
    """
    GET /api/ingestion/batches/<batch_id>/raw/
    List raw records for a specific batch.
    """
    serializer_class = RawRecordSerializer

    def get_queryset(self):
        batch_id = self.kwargs["batch_id"]
        return RawRecord.objects.filter(
            upload_batch_id=batch_id,
            organization=self.request.user.organization,
        )


class UploadStatsView(APIView):
    """
    GET /api/ingestion/stats/
    Return upload statistics for the dashboard.
    """

    def get(self, request):
        org = request.user.organization
        batches = UploadBatch.objects.filter(organization=org)

        stats = {
            "total_uploads": batches.count(),
            "completed": batches.filter(status="completed").count(),
            "partial": batches.filter(status="partial").count(),
            "failed": batches.filter(status="failed").count(),
            "processing": batches.filter(status="processing").count(),
            "total_rows_processed": sum(
                b.processed_rows for b in batches
            ),
            "total_error_rows": sum(b.error_rows for b in batches),
        }
        return Response(stats)


class DeleteUploadBatchView(APIView):
    """
    DELETE /api/ingestion/batches/<id>/delete/
    Delete an upload batch and all associated raw records + emission records.
    Admin only.
    """
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            batch = UploadBatch.objects.get(
                id=pk, organization=request.user.organization,
            )
        except UploadBatch.DoesNotExist:
            return Response({"error": "Batch not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if any associated emission records are locked
        from normalization.models import EmissionRecord
        locked_count = EmissionRecord.objects.filter(
            upload_batch=batch, is_locked=True
        ).count()
        if locked_count > 0:
            return Response(
                {"error": f"Cannot delete: {locked_count} records in this batch are locked for audit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        batch_info = {
            "file_name": batch.file_name,
            "total_rows": batch.total_rows,
            "processed_rows": batch.processed_rows,
        }

        # Cascade delete: raw records + emission records linked to this batch
        EmissionRecord.objects.filter(upload_batch=batch).delete()
        batch.delete()

        AuditService.log(
            actor=request.user,
            action="upload_deleted",
            entity_type="UploadBatch",
            entity_id=str(pk),
            previous_value=batch_info,
        )

        return Response(
            {"message": f"Upload batch '{batch_info['file_name']}' deleted successfully."},
            status=status.HTTP_200_OK,
        )


class ReprocessUploadView(APIView):
    """
    POST /api/ingestion/batches/<id>/reprocess/
    Reprocess a failed or partially failed upload batch.
    Admin only. Deletes existing emission records for error rows and re-runs the pipeline.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            batch = UploadBatch.objects.get(
                id=pk, organization=request.user.organization,
            )
        except UploadBatch.DoesNotExist:
            return Response({"error": "Batch not found."}, status=status.HTTP_404_NOT_FOUND)

        if batch.status not in ("failed", "partial"):
            return Response(
                {"error": "Only failed or partially completed batches can be reprocessed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get failed raw records
        failed_rows = RawRecord.objects.filter(
            upload_batch=batch, is_valid=False
        )

        if not failed_rows.exists():
            return Response(
                {"error": "No failed rows found to reprocess."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from normalization.services import NormalizationService
        from validation.services import ValidationService

        normalizer = NormalizationService()
        validator = ValidationService()
        source_type = batch.data_source.source_type

        reprocessed = 0
        still_failed = 0

        for raw_record in failed_rows:
            try:
                from .services.sap_parser import parse_sap_row
                from .services.utility_parser import parse_utility_row
                from .services.travel_parser import parse_travel_row

                ROW_PARSERS = {
                    "sap": parse_sap_row,
                    "utility": parse_utility_row,
                    "travel": parse_travel_row,
                }

                parser = ROW_PARSERS.get(source_type)
                if not parser:
                    still_failed += 1
                    continue

                parsed_data = parser(raw_record.raw_data)

                emission_record = normalizer.normalize(
                    source_type=source_type,
                    parsed_data=parsed_data,
                    raw_record=raw_record,
                    organization=batch.organization,
                    batch=batch,
                )

                validator.validate(emission_record, source_type)

                raw_record.is_valid = True
                raw_record.error_message = ""
                raw_record.save()
                reprocessed += 1

            except Exception as e:
                raw_record.error_message = str(e)
                raw_record.save()
                still_failed += 1

        # Update batch stats
        batch.processed_rows += reprocessed
        batch.error_rows = still_failed
        if still_failed == 0:
            batch.status = "completed"
        elif reprocessed > 0:
            batch.status = "partial"
        batch.save()

        AuditService.log(
            actor=request.user,
            action="upload_reprocessed",
            entity_type="UploadBatch",
            entity_id=str(batch.id),
            new_value={
                "reprocessed": reprocessed,
                "still_failed": still_failed,
            },
        )

        return Response({
            "message": f"Reprocessed: {reprocessed} rows recovered, {still_failed} still failing.",
            "reprocessed": reprocessed,
            "still_failed": still_failed,
            "batch_status": batch.status,
        })
