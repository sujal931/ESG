from django.contrib import admin
from .models import ApprovalAction


@admin.register(ApprovalAction)
class ApprovalActionAdmin(admin.ModelAdmin):
    list_display = ["id", "emission_record", "action", "reviewer", "created_at"]
    list_filter = ["action"]
