from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import User
from django.db.models.functions import Lower


# ---- Roles ----

ROLE_CHOICES = (
    ("user", "User"),
    ("manager", "Manager"),  
)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user", db_index=True)
    bio = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def username(self):
        return self.user.username

    def __str__(self):
        return f'Profile of {self.user.username}'

    def __repr__(self):
        return f'UserProfile(user={self.user.username}, role={self.role})'

    class Meta:
        ordering = ["-created_at"]


# ---- Tags -----

class Tag(models.Model):
    name = models.CharField(max_length=40, unique=False, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="uniq_tag_name_ci",
            )
        ]
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name}'


# ---- Posts -----

STATUS_CHOICES = (
    ('draft', 'Draft'),
    ('published', 'Published'),
    ('archived', 'Archived'),
)

class Post(models.Model):
    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="posts",
        db_index=True,
    )
    title = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        validators=[
            MinLengthValidator(2),
        ]
    )
    text = models.TextField(validators=[MinLengthValidator(5)])
    tags = models.ManyToManyField(Tag, related_name="posts", blank=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]  

    def __str__(self):
        return f'Post: {self.title} by {self.author.user.username}'


# ---- Comments ------

class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments",
        db_index=True,
    )
    author = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="comments",
        db_index=True,
    )
    text = models.TextField(validators=[MinLengthValidator(5)], max_length=500)
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name="replies")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f'Comment by {self.author.user.username} on {self.post.title}'


# ---- Likes -----

LIKE_CHOICES = (
    ('like', 'Like'),
    ('dislike', 'Dislike'),
)

class PostUserLikes(models.Model):
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="post_likes",
        db_index=True,
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="user_likes",
        db_index=True,
    )
    like_type = models.CharField(choices=LIKE_CHOICES, default="like", max_length=7)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "post"], name="uniq_user_post_like")
        ]
        indexes = [
            models.Index(fields=["post", "created_at"], name="like_post_created_idx"),
            models.Index(fields=["user", "created_at"], name="like_user_created_idx"),
        ]
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user.username} {self.like_type}d {self.post.title}"
