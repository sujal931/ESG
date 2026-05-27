from rest_framework import serializers
from .models import ApprovalAction


class ApprovalActionSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.username", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = ApprovalAction
        fields = [
            "id", "emission_record", "action", "action_display",
            "reviewer", "reviewer_name", "comment",
            "previous_status", "created_at",
        ]
        read_only_fields = ["id", "reviewer", "previous_status", "created_at"]


class ApproveRejectSerializer(serializers.Serializer):
    """Input serializer for approve/reject actions."""
    action = serializers.ChoiceField(choices=ApprovalAction.ActionType.choices)
    comment = serializers.CharField(required=False, default="", allow_blank=True)
