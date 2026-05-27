from django.urls import path
from .views import (
    UploadCSVView,
    UploadBatchListView,
    UploadBatchDetailView,
    RawRecordListView,
    UploadStatsView,
    DeleteUploadBatchView,
    ReprocessUploadView,
)

urlpatterns = [
    path("upload/", UploadCSVView.as_view(), name="upload_csv"),
    path("batches/", UploadBatchListView.as_view(), name="batch_list"),
    path("batches/<uuid:pk>/", UploadBatchDetailView.as_view(), name="batch_detail"),
    path("batches/<uuid:batch_id>/raw/", RawRecordListView.as_view(), name="raw_records"),
    path("batches/<uuid:pk>/delete/", DeleteUploadBatchView.as_view(), name="batch_delete"),
    path("batches/<uuid:pk>/reprocess/", ReprocessUploadView.as_view(), name="batch_reprocess"),
    path("stats/", UploadStatsView.as_view(), name="upload_stats"),
]
