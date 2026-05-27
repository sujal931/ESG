from django.urls import path
from .views import ApproveRejectView, BulkApproveView, ApprovalHistoryView

urlpatterns = [
    path("<uuid:record_id>/", ApproveRejectView.as_view(), name="approve_reject"),
    path("bulk/", BulkApproveView.as_view(), name="bulk_approve"),
    path("history/<uuid:record_id>/", ApprovalHistoryView.as_view(), name="approval_history"),
]
