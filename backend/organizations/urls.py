from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    MeView,
    UserListCreateView,
    UserDetailView,
    OrganizationDetailView,
)

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    # Admin-only
    path("users/", UserListCreateView.as_view(), name="user_list"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user_detail"),
    path("organization/", OrganizationDetailView.as_view(), name="organization"),
]
