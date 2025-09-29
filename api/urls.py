from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    PostViewSet, CommentViewSet, TagViewSet,
    UserViewSet, UserProfileViewSet, PostUserLikesViewSet,
    AuthViewSet,  # <-- expose auth endpoints if you use them
)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.serializers import UserProfileSerializer

router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="posts")
router.register(r"comments", CommentViewSet, basename="comments")
router.register(r"tags", TagViewSet, basename="tags")
router.register(r"users", UserViewSet, basename="users")
router.register(r"user-profiles", UserProfileViewSet, basename="user-profiles")
router.register(r"post-user-likes", PostUserLikesViewSet, basename="post-user-likes")
router.register(r"auth", AuthViewSet, basename="auth")

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    prof = request.user.profile  
    return Response({
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff,           
            "is_superuser": request.user.is_superuser,   
        },
        "profile": UserProfileSerializer(prof).data,
    })

urlpatterns = [
    path("", include(router.urls)),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", me, name="me"),
]
