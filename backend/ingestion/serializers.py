from rest_framework import serializers
from .models import DataSource, UploadBatch, RawRecord


class DataSourceSerializer(serializers.ModelSerializer):
    source_type_display = serializers.CharField(
        source="get_source_type_display", read_only=True
    )

    class Meta:
        model = DataSource
        fields = [
            "id", "source_type", "source_type_display", "name",
            "description", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UploadBatchSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.username", read_only=True
    )
    source_type = serializers.CharField(
        source="data_source.source_type", read_only=True
    )

    class Meta:
        model = UploadBatch
        fields = [
            "id", "data_source", "source_type", "uploaded_by", "uploaded_by_name",
            "file_name", "file_size", "status", "total_rows", "processed_rows",
            "error_rows", "error_message", "created_at",
        ]
        read_only_fields = ["id", "status", "total_rows", "processed_rows",
                           "error_rows", "error_message", "created_at"]


class RawRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawRecord
        fields = [
            "id", "upload_batch", "row_number", "raw_data",
            "is_valid", "error_message", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class FileUploadSerializer(serializers.Serializer):
    """Serializer for CSV file upload."""
    file = serializers.FileField()
    source_type = serializers.ChoiceField(choices=DataSource.SourceType.choices)
