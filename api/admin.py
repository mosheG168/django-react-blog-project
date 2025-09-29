from django.contrib import admin

from api.models import Tag, UserProfile, Comment, Post, PostUserLikes

admin.site.register([UserProfile, Tag, Comment, Post, PostUserLikes])

