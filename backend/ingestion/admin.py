from django.contrib import admin
from .models import DataSource, UploadBatch, RawRecord


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ["organization", "source_type", "name", "is_active"]
    list_filter = ["source_type", "is_active"]


@admin.register(UploadBatch)
class UploadBatchAdmin(admin.ModelAdmin):
    list_display = ["id", "organization", "data_source", "file_name", "status",
                    "total_rows", "processed_rows", "error_rows", "created_at"]
    list_filter = ["status", "data_source__source_type"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(RawRecord)
class RawRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "upload_batch", "row_number", "is_valid", "created_at"]
    list_filter = ["is_valid"]
