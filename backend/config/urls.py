"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("organizations.urls")),
    path("api/ingestion/", include("ingestion.urls")),
    path("api/records/", include("normalization.urls")),
    path("api/validation/", include("validation.urls")),
    path("api/approvals/", include("approvals.urls")),
    path("api/audit/", include("audit.urls")),
]
