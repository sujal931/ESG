from rest_framework import serializers
from .models import EmissionRecord
from ingestion.serializers import RawRecordSerializer


class EmissionRecordSerializer(serializers.ModelSerializer):
    scope_display = serializers.CharField(source="get_scope_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_type_display = serializers.CharField(
        source="get_source_type_display", read_only=True
    )
    validation_issues = serializers.SerializerMethodField()
    raw_data = serializers.SerializerMethodField()

    class Meta:
        model = EmissionRecord
        fields = [
            "id", "organization", "source_type", "source_type_display",
            "scope", "scope_display", "category",
            "activity_value", "activity_unit",
            "normalized_value", "normalized_unit",
            "reporting_date", "description", "metadata",
            "status", "status_display", "is_locked",
            "validation_issues", "raw_data",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def get_validation_issues(self, obj):
        from validation.serializers import ValidationIssueSerializer
        issues = obj.validation_issues.all()
        return ValidationIssueSerializer(issues, many=True).data

    def get_raw_data(self, obj):
        if obj.raw_record:
            return obj.raw_record.raw_data
        return None


class EmissionRecordListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    scope_display = serializers.CharField(source="get_scope_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_type_display = serializers.CharField(
        source="get_source_type_display", read_only=True
    )
    issue_count = serializers.SerializerMethodField()

    class Meta:
        model = EmissionRecord
        fields = [
            "id", "source_type", "source_type_display",
            "scope", "scope_display", "category",
            "activity_value", "activity_unit",
            "normalized_value", "normalized_unit",
            "reporting_date", "status", "status_display",
            "is_locked", "issue_count", "created_at",
        ]

    def get_issue_count(self, obj):
        return obj.validation_issues.count()


class EmissionRecordEditSerializer(serializers.ModelSerializer):
    """Serializer for editing normalized fields on a record."""

    class Meta:
        model = EmissionRecord
        fields = [
            "activity_value", "activity_unit",
            "normalized_value", "normalized_unit",
            "scope", "category", "description",
            "reporting_date", "metadata",
        ]
