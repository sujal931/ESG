from django.contrib import admin
from .models import ValidationIssue


@admin.register(ValidationIssue)
class ValidationIssueAdmin(admin.ModelAdmin):
    list_display = ["id", "emission_record", "severity", "rule_name", "created_at"]
    list_filter = ["severity", "rule_name"]
    search_fields = ["message", "rule_name"]
