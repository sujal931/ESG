from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from organizations.permissions import IsAdmin
from audit.services import AuditService
from .models import EmissionRecord
from .serializers import EmissionRecordSerializer, EmissionRecordListSerializer, EmissionRecordEditSerializer


class EmissionRecordListView(generics.ListAPIView):
    """
    GET /api/records/
    List normalized emission records with filtering, search, pagination.
    """
    serializer_class = EmissionRecordListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["source_type", "scope", "status", "category"]
    search_fields = ["description", "category"]
    ordering_fields = ["created_at", "reporting_date", "activity_value", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return EmissionRecord.objects.filter(
            organization=self.request.user.organization
        ).prefetch_related("validation_issues")


class EmissionRecordDetailView(generics.RetrieveAPIView):
    """
    GET /api/records/<id>/
    Full detail including raw data, validation issues, audit history.
    """
    serializer_class = EmissionRecordSerializer

    def get_queryset(self):
        return EmissionRecord.objects.filter(
            organization=self.request.user.organization
        ).select_related("raw_record").prefetch_related("validation_issues")


class EmissionRecordEditView(APIView):
    """
    PATCH /api/records/<id>/edit/
    Edit normalized fields on a record. Both roles can edit, but locked records are blocked.
    """

    def patch(self, request, pk):
        try:
            record = EmissionRecord.objects.get(
                id=pk, organization=request.user.organization
            )
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        if record.is_locked:
            return Response(
                {"error": "This record is locked for audit and cannot be edited."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EmissionRecordEditSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Capture previous values for audit
        changed_fields = {}
        for field in serializer.validated_data:
            old_val = getattr(record, field)
            new_val = serializer.validated_data[field]
            if str(old_val) != str(new_val):
                changed_fields[field] = {"old": str(old_val), "new": str(new_val)}

        serializer.save()

        if changed_fields:
            AuditService.log(
                actor=request.user,
                action="record_edited",
                entity_type="EmissionRecord",
                entity_id=str(record.id),
                previous_value=changed_fields,
                new_value={k: v["new"] for k, v in changed_fields.items()},
            )

        return Response(EmissionRecordSerializer(record).data)


class RecordLockView(APIView):
    """
    POST /api/records/<id>/lock/
    Lock/unlock a record for audit. Admin only.
    Body: { "locked": true }
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            record = EmissionRecord.objects.get(
                id=pk, organization=request.user.organization
            )
        except EmissionRecord.DoesNotExist:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        lock_state = request.data.get("locked", True)
        previous = record.is_locked
        record.is_locked = lock_state
        record.save(update_fields=["is_locked", "updated_at"])

        AuditService.log(
            actor=request.user,
            action="record_locked" if lock_state else "record_unlocked",
            entity_type="EmissionRecord",
            entity_id=str(record.id),
            previous_value={"is_locked": previous},
            new_value={"is_locked": lock_state},
        )

        action_word = "locked" if lock_state else "unlocked"
        return Response({"message": f"Record {action_word}.", "is_locked": record.is_locked})


class BulkLockView(APIView):
    """
    POST /api/records/bulk-lock/
    Bulk lock/unlock records. Admin only.
    Body: { "record_ids": [...], "locked": true }
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        record_ids = request.data.get("record_ids", [])
        lock_state = request.data.get("locked", True)

        if not record_ids:
            return Response({"error": "No record IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        records = EmissionRecord.objects.filter(
            id__in=record_ids, organization=request.user.organization
        )
        count = records.update(is_locked=lock_state)

        for record in records:
            AuditService.log(
                actor=request.user,
                action="record_locked" if lock_state else "record_unlocked",
                entity_type="EmissionRecord",
                entity_id=str(record.id),
            )

        action_word = "locked" if lock_state else "unlocked"
        return Response({"message": f"{count} records {action_word}.", "count": count})


class DashboardStatsView(APIView):
    """
    GET /api/records/dashboard/
    Aggregated stats for the analyst dashboard.
    """

    def get(self, request):
        org = request.user.organization
        qs = EmissionRecord.objects.filter(organization=org)

        status_counts = dict(
            qs.values_list("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        source_counts = dict(
            qs.values_list("source_type")
            .annotate(count=Count("id"))
            .values_list("source_type", "count")
        )

        scope_counts = dict(
            qs.values_list("scope")
            .annotate(count=Count("id"))
            .values_list("scope", "count")
        )

        issues_count = 0
        try:
            from validation.models import ValidationIssue
            issues_count = ValidationIssue.objects.filter(
                emission_record__organization=org
            ).count()
        except Exception:
            pass

        locked_count = qs.filter(is_locked=True).count()

        stats = {
            "total_records": qs.count(),
            "by_status": {
                "pending": status_counts.get("pending", 0),
                "approved": status_counts.get("approved", 0),
                "rejected": status_counts.get("rejected", 0),
                "needs_review": status_counts.get("needs_review", 0),
            },
            "by_source": {
                "sap": source_counts.get("sap", 0),
                "utility": source_counts.get("utility", 0),
                "travel": source_counts.get("travel", 0),
            },
            "by_scope": {
                "scope_1": scope_counts.get("scope_1", 0),
                "scope_2": scope_counts.get("scope_2", 0),
                "scope_3": scope_counts.get("scope_3", 0),
            },
            "validation_issues": issues_count,
            "locked_records": locked_count,
        }
        return Response(stats)
