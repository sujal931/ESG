from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.username", read_only=True, default="system")

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor", "actor_name", "action",
            "entity_type", "entity_id",
            "previous_value", "new_value", "timestamp",
        ]
        read_only_fields = fields
