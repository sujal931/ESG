from django.urls import path
from .views import (
    ValidationIssueListView,
    RecordValidationIssuesView,
    ValidationRuleListCreateView,
    ValidationRuleDetailView,
)

urlpatterns = [
    path("issues/", ValidationIssueListView.as_view(), name="issue_list"),
    path("issues/<uuid:record_id>/", RecordValidationIssuesView.as_view(), name="record_issues"),
    path("rules/", ValidationRuleListCreateView.as_view(), name="rule_list"),
    path("rules/<uuid:pk>/", ValidationRuleDetailView.as_view(), name="rule_detail"),
]
