from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken


def get_jwt(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not username or not email or not password:
            return Response({"detail": "username, email, password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "username already exists"}, status=400)

        try:
            validate_password(password)
        except Exception as e:
            return Response({"detail": list(e)}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        tokens = get_jwt(user)
        return Response(
            {
                "user": {"id": user.id, "username": user.username, "email": user.email},
                **tokens,
            },
            status=status.HTTP_201_CREATED,
        )
