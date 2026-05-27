from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from django.shortcuts import get_object_or_404

from normalization.models import EmissionRecord
from organizations.permissions import IsAdmin
from audit.services import AuditService
from .models import ApprovalAction
from .serializers import ApprovalActionSerializer, ApproveRejectSerializer


class ApproveRejectView(APIView):
    """
    POST /api/approvals/<record_id>/
    Approve or reject an emission record.
    """

    def post(self, request, record_id):
        record = get_object_or_404(
            EmissionRecord,
            id=record_id,
            organization=request.user.organization,
        )

        if record.is_locked:
            return Response(
                {"error": "This record is locked for audit and cannot be modified."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ApproveRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data["action"]
        comment = serializer.validated_data.get("comment", "")
        previous_status = record.status

        # Create approval action
        approval = ApprovalAction.objects.create(
            emission_record=record,
            action=action_type,
            reviewer=request.user,
            comment=comment,
            previous_status=previous_status,
        )

        # Update record status
        record.status = action_type
        record.save(update_fields=["status", "updated_at"])

        # Audit log
        AuditService.log(
            actor=request.user,
            action=f"record_{action_type}",
            entity_type="EmissionRecord",
            entity_id=str(record.id),
            previous_value={"status": previous_status},
            new_value={"status": action_type, "comment": comment},
        )

        return Response(
            ApprovalActionSerializer(approval).data,
            status=status.HTTP_201_CREATED,
        )


class BulkApproveView(APIView):
    """
    POST /api/approvals/bulk/
    Bulk approve/reject multiple records. Admin only.
    Body: { "record_ids": [...], "action": "approved"|"rejected", "comment": "" }
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        record_ids = request.data.get("record_ids", [])
        action_type = request.data.get("action")
        comment = request.data.get("comment", "")

        if not record_ids:
            return Response(
                {"error": "No record IDs provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action_type not in ("approved", "rejected"):
            return Response(
                {"error": "Action must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        records = EmissionRecord.objects.filter(
            id__in=record_ids,
            organization=request.user.organization,
            is_locked=False,  # Skip locked records
        )

        actions_created = []
        for record in records:
            previous_status = record.status
            approval = ApprovalAction.objects.create(
                emission_record=record,
                action=action_type,
                reviewer=request.user,
                comment=comment,
                previous_status=previous_status,
            )
            record.status = action_type
            record.save(update_fields=["status", "updated_at"])

            AuditService.log(
                actor=request.user,
                action=f"record_{action_type}",
                entity_type="EmissionRecord",
                entity_id=str(record.id),
                previous_value={"status": previous_status},
                new_value={"status": action_type, "comment": comment},
            )
            actions_created.append(approval)

        skipped = len(record_ids) - len(actions_created)
        msg = f"{len(actions_created)} records {action_type}."
        if skipped > 0:
            msg += f" {skipped} locked records skipped."

        return Response(
            {"message": msg, "count": len(actions_created), "skipped": skipped},
            status=status.HTTP_201_CREATED,
        )


class ApprovalHistoryView(generics.ListAPIView):
    """
    GET /api/approvals/history/<record_id>/
    Get approval history for a specific record.
    """
    serializer_class = ApprovalActionSerializer

    def get_queryset(self):
        record_id = self.kwargs["record_id"]
        return ApprovalAction.objects.filter(
            emission_record_id=record_id,
            emission_record__organization=self.request.user.organization,
        ).select_related("reviewer")
