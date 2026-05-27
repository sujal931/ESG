"""
Shared permissions for multi-tenant access control.
"""
from rest_framework import permissions


class IsOrganizationMember(permissions.BasePermission):
    """Ensure users can only access their own organization's data."""

    def has_object_permission(self, request, view, obj):
        # obj must have an 'organization' or 'organization_id' attribute
        org = getattr(obj, "organization", None)
        org_id = getattr(obj, "organization_id", None)
        user_org_id = request.user.organization_id
        if org:
            return str(org.id) == str(user_org_id)
        if org_id:
            return str(org_id) == str(user_org_id)
        return False


class IsAdmin(permissions.BasePermission):
    """Only organization admins."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admins can do anything; analysts get read-only access."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_admin
