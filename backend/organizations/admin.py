from django.contrib import admin
from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "industry", "is_active", "created_at"]
    search_fields = ["name", "slug"]


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["username", "email", "organization", "role", "is_active"]
    list_filter = ["role", "organization"]
    search_fields = ["username", "email"]
