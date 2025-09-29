# api/management/commands/seed_demo.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from api.models import UserProfile, Tag, Post, Comment, PostUserLikes

import random
try:
    from faker import Faker
except ImportError:
    Faker = None  

User = get_user_model()

TITLES = [
    "Hello World", "Django & DRF Tips", "Working with JWT",
    "PostgreSQL on macOS", "Filtering & Search in DRF",
    "Permissions the right way", "Signals & Profiles", "Dev Notes",
]

LOREM = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
    "Fusce a arcu non quam interdum iaculis. Sed semper, dui at "
    "dignissim viverra, purus leo congue magna, ut ultrices nunc "
    "nisi id orci."
)

TAGS = ["general", "django", "drf", "postgres", "tips", "how-to"]


class Command(BaseCommand):
    help = "Seed demo data: users, profiles, tags, posts, comments, likes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fresh",
            action="store_true",
            help="Wipe existing demo data (keeps superusers).",
        )
        parser.add_argument(
            "--users",
            type=int,
            default=4,
            help="Total users to end up with (min 4; default 4). Always includes admin/demo/alice/bob.",
        )
        parser.add_argument(
            "--posts",
            type=int,
            default=None,
            help="Total posts to create (optional). If omitted, ~3 per non-admin user.",
        )
        parser.add_argument(
            "--comments",
            type=int,
            default=None,
            help="Total comments to create (optional). If omitted, 0–2 per post.",
        )
        parser.add_argument(
            "--likes",
            type=int,
            default=None,
            help="Total likes to create (optional). If omitted, 0–N per post.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        # --- prerequisites ---
        if Faker is None:
            self.stdout.write(self.style.WARNING(
                "Faker not installed. Installing it is recommended for nicer fake data:\n"
                "  pip install Faker"
            ))
        fake = Faker() if Faker else None

        fresh = opts["fresh"]
        total_users = max(4, int(opts["users"]))
        total_posts = opts["posts"]
        total_comments = opts["comments"]
        total_likes = opts["likes"]

        # --- destructive cleanup in safe order ---
        if fresh:
            self.stdout.write(self.style.WARNING("Wiping demo content (likes → comments → posts → tags → non-superusers)..."))
            PostUserLikes.objects.all().delete()
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Tag.objects.all().delete()
            # remove non-superusers to get a clean slate (keep superusers)
            for u in User.objects.filter(is_superuser=False):
                # cascade will remove their UserProfile via FK if defined as such; but
                # we ensure profiles later anyway
                u.delete()

        # --- base 4 users (idempotent) ---
        self.stdout.write("Ensuring base users exist (admin/demo/alice/bob)...")
        base_specs = [
            {"username": "admin", "email": "admin@example.com", "is_superuser": True,  "is_staff": True},
            {"username": "demo",  "email": "demo@example.com",  "is_superuser": False, "is_staff": False},
            {"username": "alice", "email": "alice@example.com", "is_superuser": False, "is_staff": False},
            {"username": "bob",   "email": "bob@example.com",   "is_superuser": False, "is_staff": False},
        ]
        users = []
        for spec in base_specs:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "is_superuser": spec["is_superuser"],
                    "is_staff": spec["is_staff"],
                },
            )
            if created:
                user.set_password("StrongPass123!")
                user.save()
            users.append(user)

        # --- add extra users up to --users ---
        current_total = User.objects.count()
        if current_total < total_users:
            extra_needed = total_users - current_total
            self.stdout.write(f"Creating {extra_needed} extra users...")
            for i in range(extra_needed):
                uname = (fake.user_name() if fake else f"user{i+1}")  # best effort unique
                # ensure uniqueness if Faker collides
                base_uname = uname
                suffix = 1
                while User.objects.filter(username=uname).exists():
                    suffix += 1
                    uname = f"{base_uname}{suffix}"

                u = User.objects.create_user(
                    username=uname,
                    email=(fake.email() if fake else f"{uname}@example.com"),
                    password="StrongPass123!",
                )
                users.append(u)
        else:
            # refresh list to include any existing users beyond base 4
            users = list(User.objects.all())

        # --- ensure a profile for every user ---
        self.stdout.write("Ensuring profiles exist for all users...")
        for u in users:
            UserProfile.objects.get_or_create(user=u)

        # --- tags (idempotent) ---
        self.stdout.write("Creating tags (idempotent)...")
        tag_objs = []
        for name in TAGS:
            tag, _ = Tag.objects.get_or_create(name=name)
            tag_objs.append(tag)

        # --- authors = all non-superusers ---
        authors = [u for u in users if not u.is_superuser]
        if not authors:
            self.stdout.write(self.style.WARNING("No non-admin authors found; posts/comments/likes will be skipped."))
            authors_profiles = []
        else:
            authors_profiles = [u.userprofile for u in authors]

        # --- posts ---
        post_objs = []

        if total_posts is None:
            # default: ~3 posts per author
            default_ppu = 3
            self.stdout.write(f"Creating ~{default_ppu} posts per non-admin user (total ~{len(authors_profiles)*default_ppu})...")
            for prof in authors_profiles:
                for i in range(default_ppu):
                    title = f"{random.choice(TITLES)} ({prof.user.username} #{i+1})"
                    post, created = Post.objects.get_or_create(
                        title=title,
                        defaults={
                            "text": LOREM if not fake else fake.paragraph(nb_sentences=5),
                            "status": random.choice(["draft", "published"]),
                            "author": prof,
                            "created_at": timezone.now(),
                        },
                    )
                    chosen = random.sample(tag_objs, k=random.randint(0, min(3, len(tag_objs))))
                    if created or post.tags.count() == 0:
                        post.tags.set(chosen)
                    post_objs.append(post)
        else:
            self.stdout.write(f"Creating {total_posts} posts across authors...")
            for i in range(int(total_posts)):
                prof = random.choice(authors_profiles) if authors_profiles else None
                if prof is None:
                    break
                title = f"{random.choice(TITLES)} (#{i+1})"
                post = Post.objects.create(
                    title=title,
                    text=LOREM if not fake else fake.paragraph(nb_sentences=5),
                    status=random.choice(["draft", "published"]),
                    author=prof,
                    created_at=timezone.now(),
                )
                post.tags.set(random.sample(tag_objs, k=random.randint(0, min(3, len(tag_objs)))))
                post_objs.append(post)

        # --- comments ---
        if post_objs and authors_profiles:
            if total_comments is None:
                self.stdout.write("Creating 0–2 comments per post...")
                for post in post_objs:
                    commenters = [p for p in authors_profiles if p != post.author]
                    for _ in range(random.randint(0, 2)):
                        if not commenters:
                            break
                        cprof = random.choice(commenters)
                        Comment.objects.get_or_create(
                            post=post,
                            author=cprof,
                            text=f"Nice post, {post.author.user.username}!",
                        )
            else:
                self.stdout.write(f"Creating {total_comments} comments total...")
                for i in range(int(total_comments)):
                    post = random.choice(post_objs)
                    commenters = [p for p in authors_profiles if p != post.author]
                    if not commenters:
                        continue
                    cprof = random.choice(commenters)
                    Comment.objects.create(
                        post=post,
                        author=cprof,
                        text=(f"Comment #{i+1}" if not fake else fake.sentence()),
                    )

        # --- likes ---
        if post_objs and authors_profiles:
            if total_likes is None:
                self.stdout.write("Creating 0–N likes per post...")
                for post in post_objs:
                    likers = random.sample(authors_profiles, k=random.randint(0, len(authors_profiles)))
                    for lp in likers:
                        PostUserLikes.objects.get_or_create(post=post, user=lp)
            else:
                self.stdout.write(f"Creating {total_likes} likes total...")
                # Avoid duplicates by attempting get_or_create
                for _ in range(int(total_likes)):
                    post = random.choice(post_objs)
                    lp = random.choice(authors_profiles)
                    PostUserLikes.objects.get_or_create(post=post, user=lp)

        # --- summary ---
        out = {
            "users": User.objects.count(),
            "profiles": UserProfile.objects.count(),
            "tags": Tag.objects.count(),
            "posts": Post.objects.count(),
            "comments": Comment.objects.count(),
            "likes": PostUserLikes.objects.count(),
        }
        self.stdout.write(self.style.SUCCESS(f"Seeded ✅  {out}"))
        self.stdout.write(self.style.SUCCESS(
            "Logins you can use:\n"
            "  admin / StrongPass123!\n"
            "  demo  / StrongPass123!\n"
            "  alice / StrongPass123!\n"
            "  bob   / StrongPass123!\n"
        ))
