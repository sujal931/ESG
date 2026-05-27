from rest_framework import generics
from organizations.permissions import IsAdmin, IsAdminOrReadOnly
from .models import ValidationIssue, ValidationRule
from .serializers import ValidationIssueSerializer, ValidationRuleSerializer


class ValidationIssueListView(generics.ListAPIView):
    """
    GET /api/validation/issues/
    List all validation issues for the current org.
    """
    serializer_class = ValidationIssueSerializer

    def get_queryset(self):
        return ValidationIssue.objects.filter(
            emission_record__organization=self.request.user.organization
        ).select_related("emission_record")


class RecordValidationIssuesView(generics.ListAPIView):
    """
    GET /api/validation/issues/<record_id>/
    List validation issues for a specific record.
    """
    serializer_class = ValidationIssueSerializer

    def get_queryset(self):
        record_id = self.kwargs["record_id"]
        return ValidationIssue.objects.filter(
            emission_record_id=record_id,
            emission_record__organization=self.request.user.organization,
        )


class ValidationRuleListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/validation/rules/      — List rules (all users)
    POST /api/validation/rules/      — Create rule (admin only)
    """
    serializer_class = ValidationRuleSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return ValidationRule.objects.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class ValidationRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/validation/rules/<id>/   — Rule detail (all users)
    PATCH  /api/validation/rules/<id>/   — Update rule (admin only)
    DELETE /api/validation/rules/<id>/   — Delete rule (admin only)
    """
    serializer_class = ValidationRuleSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return ValidationRule.objects.filter(
            organization=self.request.user.organization
        )
