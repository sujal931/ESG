from django.urls import path
from .views import (
    EmissionRecordListView,
    EmissionRecordDetailView,
    EmissionRecordEditView,
    RecordLockView,
    BulkLockView,
    DashboardStatsView,
)

urlpatterns = [
    path("", EmissionRecordListView.as_view(), name="record_list"),
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("bulk-lock/", BulkLockView.as_view(), name="bulk_lock"),
    path("<uuid:pk>/", EmissionRecordDetailView.as_view(), name="record_detail"),
    path("<uuid:pk>/edit/", EmissionRecordEditView.as_view(), name="record_edit"),
    path("<uuid:pk>/lock/", RecordLockView.as_view(), name="record_lock"),
]
