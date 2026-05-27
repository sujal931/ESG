from rest_framework import generics
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/
    List audit logs for the current org.
    Admins see all logs. Analysts only see their own actions.
    """
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.filter(
            actor__organization=user.organization
        ).select_related("actor")

        # Analysts only see their own audit entries
        if not user.is_admin:
            qs = qs.filter(actor=user)

        # Optional filter by entity
        entity_type = self.request.query_params.get("entity_type")
        entity_id = self.request.query_params.get("entity_id")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        return qs


class EntityAuditLogView(generics.ListAPIView):
    """
    GET /api/audit/<entity_type>/<entity_id>/
    Audit history for a specific entity.
    Analysts can see entity-specific logs (for records they review).
    """
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(
            entity_type=self.kwargs["entity_type"],
            entity_id=self.kwargs["entity_id"],
            actor__organization=self.request.user.organization,
        ).select_related("actor")
