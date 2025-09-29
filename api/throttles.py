from rest_framework import throttling
from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache as django_cache


class MyRateThrottle(throttling.BaseThrottle):
    def allow_request(self, request, view):
        user = request.user
        username = user.username

        if not django_cache.get(username):
            django_cache.set(username, 0, timeout=60)

        django_cache.incr(username)

        return django_cache.get(username) <= 10