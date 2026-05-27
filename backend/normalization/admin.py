from django.contrib import admin
from .models import EmissionRecord


@admin.register(EmissionRecord)
class EmissionRecordAdmin(admin.ModelAdmin):
    list_display = [
        "id", "organization", "source_type", "scope", "category",
        "activity_value", "activity_unit", "status", "reporting_date", "created_at",
    ]
    list_filter = ["source_type", "scope", "status"]
    search_fields = ["description", "category"]
    readonly_fields = ["id", "created_at", "updated_at"]
