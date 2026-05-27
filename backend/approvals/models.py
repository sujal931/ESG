"""
ApprovalAction — records each approve/reject decision.
"""
import uuid
from django.db import models
from organizations.models import User
from normalization.models import EmissionRecord


class ApprovalAction(models.Model):
    """An approval or rejection action taken on an EmissionRecord."""

    class ActionType(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emission_record = models.ForeignKey(
        EmissionRecord, on_delete=models.CASCADE, related_name="approval_actions"
    )
    action = models.CharField(max_length=20, choices=ActionType.choices)
    reviewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="approvals"
    )
    comment = models.TextField(blank=True, default="")
    previous_status = models.CharField(max_length=20, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_action_display()} by {self.reviewer} on {self.emission_record_id}"
