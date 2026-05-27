from django.urls import path
from .views import AuditLogListView, EntityAuditLogView

urlpatterns = [
    path("", AuditLogListView.as_view(), name="audit_list"),
    path("<str:entity_type>/<str:entity_id>/", EntityAuditLogView.as_view(), name="entity_audit"),
]
