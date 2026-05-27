from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["id", "actor", "action", "entity_type", "entity_id", "timestamp"]
    list_filter = ["action", "entity_type"]
    search_fields = ["entity_id", "action"]
    readonly_fields = ["id", "actor", "action", "entity_type", "entity_id",
                       "previous_value", "new_value", "timestamp"]
