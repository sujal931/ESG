from rest_framework import serializers
from .models import ValidationIssue, ValidationRule


class ValidationIssueSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(
        source="get_severity_display", read_only=True
    )

    class Meta:
        model = ValidationIssue
        fields = [
            "id", "emission_record", "severity", "severity_display",
            "rule_name", "message", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ValidationRuleSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(
        source="get_severity_display", read_only=True
    )

    class Meta:
        model = ValidationRule
        fields = [
            "id", "rule_name", "display_name", "description",
            "severity", "severity_display", "is_enabled",
            "threshold", "source_types",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
