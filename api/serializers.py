# api/serializers.py
from django.core.validators import RegexValidator
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from api.models import Post, UserProfile, Tag, PostUserLikes, Comment


class CurrentProfileDefault:
    """Resolve the current user's profile, or None if anonymous."""
    requires_context = True

    def __call__(self, serializer_field):
        request = serializer_field.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return None
        user = request.user
        # Prefer related_name="profile", but fall back to the default reverse name
        return getattr(user, "profile", None) or getattr(user, "userprofile", None)


# ---------------- User / Profile ----------------
class UserProfileSerializer(ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["id", "user", "username", "role", "bio", "birth_date", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_username(self, obj):
        return obj.user.username if getattr(obj, "user", None) else None


class UserSerializer(ModelSerializer):
    """
    Registration serializer for Django's auth User.
    Also creates a UserProfile with role='user'.
    """
    password = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$",
                message=(
                    "Password must be at least 8 characters long and contain "
                    "at least one lowercase, one uppercase, one digit, and one special character."
                ),
            )
        ],
        write_only=True,
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        # Create the user with password in one step
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        # Ensure profile exists with default role; avoid duplicates on retries
        UserProfile.objects.get_or_create(
            user=user,
            defaults={"role": "user"} if hasattr(UserProfile, "role") else {},
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ---------------- Tags ----------------
class TagSerializer(ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]
        read_only_fields = ["id"]


# ---------------- Posts ----------------
class PostSerializer(ModelSerializer):
    # Set author implicitly to current user's profile
    author = serializers.HiddenField(default=CurrentProfileDefault())
    author_id = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_inputs = serializers.ListField(
        child=serializers.CharField(trim_whitespace=True),
        write_only=True,
        required=False,
        help_text="List of tag IDs or names (mix allowed); at least one required on create."
    )

    likes_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()
    likers = serializers.SerializerMethodField()  # visible to post owner or manager

    class Meta:
        model = Post
        fields = [
            "id",
            "author", "author_id", "author_username",
            "title", "text",
            "tags", "tag_inputs",
            "likes_count", "liked_by_me", "likers",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tags", "likes_count", "liked_by_me", "likers", "created_at", "updated_at"]

    # ---------- getters ----------
    def get_author_username(self, obj):
        try:
            return obj.author.user.username
        except Exception:
            return None
        
    def get_author_id(self, obj):
        return obj.author.id if getattr(obj, "author", None) else None

    def get_liked_by_me(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        user = request.user
        profile = getattr(user, "profile", None) or getattr(user, "userprofile", None)
        if not profile:
            return False
        return PostUserLikes.objects.filter(post=obj, user=profile).exists()

    def get_likers(self, obj):
        """
        Return a light list of likers only if the requester is the post owner
        or has manager role.
        """
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return None
        user = request.user
        me = getattr(user, "profile", None) or getattr(user, "userprofile", None)
        if not me:
            return None

        is_owner = getattr(obj, "author_id", None) == getattr(me, "id", None)
        is_manager = getattr(me, "role", "") == "manager"
        if not (is_owner or is_manager):
            return None

        qs = (
            PostUserLikes.objects
            .filter(post=obj)
            .select_related("user__user")
            .order_by("-id")[:50]
        )
        return [
            {
                "id": l.user.id,
                "username": getattr(l.user.user, "username", None),
            }
            for l in qs
        ]

    # ---------- helpers ----------
    def _resolve_tags(self, tag_inputs):
        """
        Accept list like ["1","dev","3","python"] and return Tag instances.
        - If numeric, resolve by id.
        - Else resolve by case-insensitive name; create if not exists.
        """
        if not tag_inputs:
            raise serializers.ValidationError({"tag_inputs": ["At least one category tag is required."]})

        resolved = []
        for v in tag_inputs:
            raw = str(v).strip()
            if not raw:
                continue

            if raw.isdigit():
                t = Tag.objects.filter(id=int(raw)).first()
                if t:
                    resolved.append(t)
                    continue

            t = Tag.objects.filter(name__iexact=raw).first()
            if not t:
                t = Tag.objects.create(name=raw)
            resolved.append(t)

        if not resolved:
            raise serializers.ValidationError({"tag_inputs": ["At least one valid tag is required."]})
        return resolved

    # ---------- create/update ----------
    def create(self, validated_data):
        author = validated_data.get("author")
        if author is None:
            # Shouldn’t happen if permissions are set, but fail clearly.
            raise serializers.ValidationError({"author": ["Authentication required."]})

        tag_inputs = validated_data.pop("tag_inputs", None)
        if not tag_inputs:
            raise serializers.ValidationError({"tag_inputs": ["At least one category tag is required."]})

        post = super().create(validated_data)
        post.tags.set(self._resolve_tags(tag_inputs))
        return post

    def update(self, instance, validated_data):
        tag_inputs = validated_data.pop("tag_inputs", None)
        post = super().update(instance, validated_data)
        if tag_inputs is not None:
            post.tags.set(self._resolve_tags(tag_inputs))
        return post


# ---------------- Comments ----------------
class CommentSerializer(ModelSerializer):
    author = serializers.HiddenField(default=CurrentProfileDefault())
    author_id = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField() 

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "author_id", "author_username", "text", "reply_to", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_author_id(self, obj):
        return obj.author.id if getattr(obj, "author", None) else None
    
    def get_author_username(self, obj):
        try:
            return obj.author.user.username
        except Exception:
            return None

    def validate(self, attrs):
        # ensure author exists on create
        if self.instance is None and not attrs.get("author"):
            raise serializers.ValidationError({"author": ["Authentication required."]})
        return attrs


# ---------------- Likes ----------------
class PostUserLikesSerializer(ModelSerializer):
    user = serializers.HiddenField(default=CurrentProfileDefault())
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = PostUserLikes
        fields = ["id", "user", "user_id", "post", "like_type", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_user_id(self, obj):
        return obj.user.id if getattr(obj, "user", None) else None
