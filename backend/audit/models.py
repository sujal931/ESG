"""
AuditLog — immutable log of all important actions.
"""
import uuid
from django.db import models
from organizations.models import User


class AuditLog(models.Model):
    """Immutable audit trail entry."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(
        max_length=100,
        help_text="Action identifier (e.g. upload_started, record_approved)",
    )
    entity_type = models.CharField(
        max_length=100,
        help_text="Model name of the affected entity",
    )
    entity_id = models.CharField(
        max_length=255,
        help_text="ID of the affected entity",
    )
    previous_value = models.JSONField(
        null=True, blank=True,
        help_text="State before the action",
    )
    new_value = models.JSONField(
        null=True, blank=True,
        help_text="State after the action",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["actor", "timestamp"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "system"
        return f"[{self.timestamp}] {actor_name} → {self.action} on {self.entity_type}:{self.entity_id}"
