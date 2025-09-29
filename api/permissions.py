from rest_framework.permissions import SAFE_METHODS, BasePermission

def is_manager(user):
    try:
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        prof = getattr(user, "profile", None)
        return getattr(prof, "role", "") == "manager"
    except Exception:
        return False

def current_profile_id(user):
    try:
        prof = getattr(user, "profile", None)
        return getattr(prof, "id", None)
    except Exception:
        return None


# --- Posts ---
class PostsPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_manager(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return is_manager(request.user)


# --- Comments ---
class CommentsPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return bool(request.user and request.user.is_authenticated)
        return is_manager(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return bool(request.user and request.user.is_authenticated)
        return is_manager(request.user)


# --- Tags ---
class TagsPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_manager(request.user)


# --- UserProfile ---
class UserProfilePermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return is_manager(request.user) or (obj.user_id == getattr(request.user, "id", None))


# --- Likes ---
class PostUserLikesPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_manager(request.user):
            return True
        return obj.user_id == current_profile_id(request.user)


# --- Admin-only Users ViewSet guard ---
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_manager(request.user)
