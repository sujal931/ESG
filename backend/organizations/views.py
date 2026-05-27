from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Organization, User
from .permissions import IsAdmin
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserManageSerializer,
    OrganizationSerializer,
    CustomTokenObtainPairSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data, status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    """Return the current authenticated user."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Admin-only: User Management ─────────────────────────────


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/       — List users in the org (admin only)
    POST /api/auth/users/       — Create a new user in the org (admin only)
    """
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserManageSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(
            organization=self.request.user.organization
        ).select_related("organization")

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/users/<id>/  — User detail
    PATCH  /api/auth/users/<id>/  — Update user
    DELETE /api/auth/users/<id>/  — Remove user from org
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.filter(
            organization=self.request.user.organization
        ).select_related("organization")

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin-only: Organization Info ────────────────────────────


class OrganizationDetailView(APIView):
    """
    GET  /api/auth/organization/   — View org details
    PATCH /api/auth/organization/  — Update org (admin only)
    """

    def get(self, request):
        org = request.user.organization
        return Response(OrganizationSerializer(org).data)

    def patch(self, request):
        if not request.user.is_admin:
            return Response(
                {"error": "Only admins can update organization settings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        org = request.user.organization
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
