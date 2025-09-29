# ---------- imports ----------
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework.decorators import action
from django.db.models import Count
from django.contrib.auth.models import User

from api.models import Tag, Post, PostUserLikes, UserProfile, Comment
from api.permissions import (
    IsAdmin, PostUserLikesPermission,
    PostsPermission, TagsPermission, UserProfilePermission,
    CommentsPermission,
)
from api.serializers import (
    TagSerializer, CommentSerializer, PostUserLikesSerializer,
    PostSerializer, UserProfileSerializer, UserSerializer
)
from api.throttles import MyRateThrottle
from rest_framework.authtoken.serializers import AuthTokenSerializer
from api.auth import get_jwt


# ---------- Auth ----------
class AuthViewSet(ViewSet):
    queryset = User.objects.all()
    serializer_class = AuthTokenSerializer
    permission_classes = [AllowAny]

    def list(self, request):
        return Response({
            "login": 'http://localhost:8000/api/auth/login/',
            "register": 'http://localhost:8000/api/auth/register/'
        })

    @action(detail=False, methods=['post', 'get'])
    def login(self, request):
        serializer = AuthTokenSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True) 
        user = serializer.validated_data['user']
        jwt = get_jwt(user)
        return Response(jwt)

    @action(detail=False, methods=['post', 'get'])
    def register(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        jwt = get_jwt(user)
        return Response(
            {"message": "User registered successfully", **jwt, "user": serializer.data},
            status=status.HTTP_201_CREATED
        )


# ---------- Tags ----------
class TagViewSet(ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [TagsPermission]
    throttle_classes = [MyRateThrottle]


# ---------- Posts ----------
class PostViewSet(ModelViewSet):
    queryset = (
        Post.objects
        .select_related("author__user")
        .prefetch_related("tags")
        .annotate(likes_count=Count("user_likes", distinct=True))  # correct reverse name
    )
    serializer_class = PostSerializer
    permission_classes = [PostsPermission]

    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]

    filterset_fields = {
        "author": ["exact"],
        "author_id": ["exact"],
        "tags": ["exact"],
    }

    search_fields = [
        "title",
        "text",
        "author__user__username",
        "tags__name",
    ]

    ordering_fields = ["title", "created_at", "updated_at", "likes_count"]
    ordering = ["-created_at"]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        qs = super().get_queryset()

        # Optional friendly tag filter by name: ?tag=<name>
        tag_name = self.request.query_params.get("tag")
        if tag_name:
            qs = qs.filter(tags__name__iexact=tag_name.strip())

        # Optional tag id: ?tag_id=<id>
        tag_id = self.request.query_params.get("tag_id")
        if tag_id and str(tag_id).isdigit():
            qs = qs.filter(tags__id=int(tag_id))

        # DISTINCT avoids duplicates due to M2M joins
        return qs.distinct()

    @action(detail=False, methods=["get"], permission_classes=[IsAdmin])
    def mine(self, request):
        """
        List posts authored by the current user (admin-only endpoint).
        Robust to either reverse name: user.profile or user.userprofile.
        """
        u = request.user
        profile = getattr(u, "profile", None) or getattr(u, "userprofile", None)
        if profile is None:
            return Response([], status=status.HTTP_200_OK)

        qs = self.get_queryset().filter(author=profile).order_by("-created_at")
        ser = self.get_serializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def tag_suggest(self, request):
        """
        GET /api/posts/tag_suggest/?q=py
        Returns top 10 tags (by usage) matching q.
        Public (no auth required).
        """
        q = request.query_params.get("q", "").strip()
        tags_qs = Tag.objects.annotate(n=Count("posts", distinct=True))
        if q:
            tags_qs = tags_qs.filter(name__icontains=q)
        tags_qs = tags_qs.order_by("-n", "name")[:10]
        return Response([{"id": t.id, "name": t.name, "count": t.n} for t in tags_qs])


# ---------- Comments ----------
class CommentViewSet(ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [CommentsPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["post"]
    ordering_fields = ["id", "created_at"]
    ordering = ["-id"]


# ---------- PostUserLikes ----------
class PostUserLikesViewSet(ModelViewSet):
    queryset = PostUserLikes.objects.select_related("user", "post").all().order_by("-id")
    serializer_class = PostUserLikesSerializer
    permission_classes = [IsAuthenticated, PostUserLikesPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["post"]
    ordering_fields = ["id", "created_at"]
    ordering = ["-id"]

    def get_queryset(self):
        base = super().get_queryset()
        if self.action == "list":
            return base.filter(user__user=self.request.user)
        return base

    def create(self, request, *args, **kwargs):
        """
        Idempotent like:
        - POST {"post": <id>} → 201 Created on first like
        - POST again for same post/user → 200 OK
        """
        post_id = request.data.get("post")
        if not post_id:
            return Response({"post": ["This field is required."]},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            post_id = int(post_id)
        except (TypeError, ValueError):
            return Response({"post": ["Must be an integer."]},
                            status=status.HTTP_400_BAD_REQUEST)

        profile = request.user.profile
        like, created = PostUserLikes.objects.get_or_create(post_id=post_id, user=profile)

        self.check_object_permissions(request, like)

        serializer = self.get_serializer(like)
        return Response(serializer.data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=["delete"], url_path=r"(?P<post_id>\d+)/by-post")
    def delete_by_post(self, request, post_id=None):
        """
        DELETE /api/post-user-likes/<post_id>/by-post/ → unlike this post for the current user.
        """
        profile = request.user.profile
        try:
            like = PostUserLikes.objects.get(post_id=post_id, user=profile)
        except PostUserLikes.DoesNotExist:
            return Response({"detail": "Like not found."}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, like)
        like.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- UserProfile ----------
class UserProfileViewSet(ModelViewSet):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer
    permission_classes = [UserProfilePermission]


# ---------- Users ----------
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
