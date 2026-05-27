"""
Audit service — simple interface for creating audit log entries.
"""
from .models import AuditLog


class AuditService:
    """Static service for creating audit log entries."""

    @staticmethod
    def log(actor, action, entity_type, entity_id,
            previous_value=None, new_value=None):
        """Create an audit log entry."""
        return AuditLog.objects.create(
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            previous_value=previous_value,
            new_value=new_value,
        )
