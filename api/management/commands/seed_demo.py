# api/management/commands/seed_demo.py
from __future__ import annotations

import os
import sys
import random
import secrets
from pathlib import Path
from typing import List, Optional

from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from api.models import UserProfile, Tag, Post, Comment, PostUserLikes

try:
    from faker import Faker
except ImportError:
    Faker = None  # type: ignore

User = get_user_model()

TITLES: List[str] = [
    "Hello World", "Django & DRF Tips", "Working with JWT",
    "PostgreSQL on macOS", "Filtering & Search in DRF",
    "Permissions the right way", "Signals & Profiles", "Dev Notes",
]

LOREM: str = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
    "Fusce a arcu non quam interdum iaculis. Sed semper, dui at "
    "dignissim viverra, purus leo congue magna, ut ultrices nunc "
    "nisi id orci."
)

TAGS: List[str] = ["general", "django", "drf", "postgres", "tips", "how-to"]


# ----------------- small schema helpers (no assumptions) -----------------
def has_field(model, name: str) -> bool:
    for f in model._meta.get_fields():
        if f.name == name and not f.many_to_many and not f.one_to_many:
            return True
    return False

def get_field(model, name: str):
    return model._meta.get_field(name)

def has_m2m(model, name: str) -> bool:
    for f in model._meta.get_fields():
        if f.name == name and f.many_to_many:
            return True
    return False


class Command(BaseCommand):
    help = (
        "Seed demo data: users, profiles, tags, posts, comments, likes. "
        "SAFE by default: refuses on DEBUG=False unless --allow-prod."
    )

    def add_arguments(self, parser):
        parser.add_argument("--fresh", action="store_true",
                            help="Delete demo content before seeding (prompts unless -y).")
        parser.add_argument("--only-demo-fresh", action="store_true",
                            help="With --fresh, delete only demo users (@example.com) and demo content.")
        parser.add_argument("--yes", "-y", action="store_true",
                            help="Assume 'yes' for prompts (useful in CI).")

        parser.add_argument("--users", type=int, default=4,
                            help="Total users to end up with (min 4; default 4).")
        parser.add_argument("--posts", type=int, default=None,
                            help="Total posts to create (optional). If omitted, ~3 per non-admin user.")
        parser.add_argument("--comments", type=int, default=None,
                            help="Total comments to create (optional). If omitted, 0–2 per post.")
        parser.add_argument("--likes", type=int, default=None,
                            help="Total likes to create (optional). If omitted, 0–N per post.")
        parser.add_argument("--seed", type=int, default=None,
                            help="Deterministic RNG seed for reproducible data (e.g., --seed 42).")
        parser.add_argument("--allow-prod", action="store_true",
                            help="Explicitly allow seeding when DEBUG=False (use with caution!).")

    @transaction.atomic
    def handle(self, *args, **opts):
        # ---------- env guard ----------
        demo_env = os.getenv("DEMO_DATA", "").strip().lower() in {"1", "true", "yes"}
        allow_prod = bool(opts.get("allow_prod"))
        if not (settings.DEBUG or demo_env or allow_prod):
            self.stdout.write(self.style.ERROR(
                "Refusing to seed because DEBUG=False and DEMO_DATA is not set. "
                "Run with DEMO_DATA=1 or pass --allow-prod."
            ))
            sys.exit(2)

        # ---------- RNG ----------
        rng_seed = opts.get("seed")
        if rng_seed is not None:
            random.seed(int(rng_seed))

        # ---------- Faker ----------
        if Faker is None:
            self.stdout.write(self.style.WARNING(
                "Faker not installed. Install for richer fake data:\n"
                "  pip install Faker"
            ))
            fake = None
        else:
            fake = Faker()

        # ---------- args ----------
        total_users = max(4, int(opts["users"]))
        total_posts: Optional[int] = opts["posts"]
        total_comments: Optional[int] = opts["comments"]
        total_likes: Optional[int] = opts["likes"]
        fresh = bool(opts["fresh"])
        only_demo_fresh = bool(opts["only_demo_fresh"])
        assume_yes = bool(opts["yes"])

        # ---------- password handling ----------
        demo_password = os.getenv("DEMO_PASSWORD")
        generated = False
        if not demo_password:
            demo_password = secrets.token_urlsafe(15)
            generated = True
        demo_password_hash = make_password(demo_password)
        creds_note_path = Path(".demo_credentials.txt")

        # ---------- cleanup ----------
        if fresh:
            if not assume_yes and not self._confirm(
                "This will delete content (likes → comments → posts → tags → users). Continue? [y/N]: "
            ):
                self.stdout.write("Aborted.")
                return

            self.stdout.write(self.style.WARNING(
                "Wiping content (likes → comments → posts → tags → users)…"
            ))
            PostUserLikes.objects.all().delete()
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Tag.objects.all().delete()
            if only_demo_fresh:
                User.objects.filter(email__iendswith="@example.com").exclude(is_superuser=True).delete()
            else:
                User.objects.filter(is_superuser=False, is_staff=False).delete()

        # ---------- base users ----------
        self.stdout.write("Ensuring base users exist (admin/demo/alice/bob)…")
        base_specs = [
            {"username": "admin", "email": "admin@example.com", "is_superuser": True,  "is_staff": True},
            {"username": "demo",  "email": "demo@example.com",  "is_superuser": False, "is_staff": False},
            {"username": "alice", "email": "alice@example.com", "is_superuser": False, "is_staff": False},
            {"username": "bob",   "email": "bob@example.com",   "is_superuser": False, "is_staff": False},
        ]
        users: List[User] = []
        for spec in base_specs:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "is_superuser": spec["is_superuser"],
                    "is_staff": spec["is_staff"],
                    "password": demo_password_hash,
                },
            )
            if not created and not user.has_usable_password():
                user.password = demo_password_hash
                user.save(update_fields=["password"])
            users.append(user)

        # ---------- extra users ----------
        current_total = User.objects.count()
        if current_total < total_users:
            extra_needed = total_users - current_total
            self.stdout.write(f"Creating {extra_needed} extra users…")
            for i in range(extra_needed):
                uname = (fake.user_name() if fake else f"user{i+1}")
                base_uname = uname
                suffix = 1
                while User.objects.filter(username=uname).exists():
                    suffix += 1
                    uname = f"{base_uname}{suffix}"
                email = (fake.email() if fake else f"{uname}@example.com")
                u = User.objects.create_user(
                    username=uname,
                    email=email,
                    password=demo_password,  # create_user will hash
                )
                users.append(u)
        else:
            users = list(User.objects.all())

        # ---------- profiles ----------
        self.stdout.write("Ensuring profiles exist for all users…")
        for u in users:
            UserProfile.objects.get_or_create(user=u)

        # ---------- tags ----------
        self.stdout.write("Creating tags (idempotent)…")
        tag_objs: List[Tag] = []
        for name in TAGS:
            tag, _ = Tag.objects.get_or_create(name=name)
            tag_objs.append(tag)

        # ---------- authors/profiles (no reverse attr assumptions) ----------
        authors = User.objects.filter(is_superuser=False)
        authors_profiles = list(UserProfile.objects.select_related("user").filter(user__in=authors))

        # ---------- posts ----------
        post_objs: List[Post] = []
        if authors_profiles:
            def make_post_defaults(prof: UserProfile):
                defaults = {}
                # only set fields that actually exist
                if has_field(Post, "text"):
                    defaults["text"] = LOREM if not fake else fake.paragraph(nb_sentences=5)
                if has_field(Post, "status"):
                    defaults["status"] = random.choice(["draft", "published"])
                if has_field(Post, "author"):
                    defaults["author"] = prof
                if has_field(Post, "created_at"):
                    f = get_field(Post, "created_at")
                    # set only if editable or no auto_now_add
                    try:
                        if getattr(f, "editable", True) and not getattr(f, "auto_now_add", False):
                            defaults["created_at"] = timezone.now()
                    except Exception:
                        pass
                return defaults

            if total_posts is None:
                default_ppu = 3
                approx_total = len(authors_profiles) * default_ppu
                self.stdout.write(f"Creating ~{default_ppu} posts per non-admin user (total ~{approx_total})…")
                for prof in authors_profiles:
                    for i in range(default_ppu):
                        title = f"{random.choice(TITLES)} ({prof.user.username} #{i+1})"
                        defaults = make_post_defaults(prof)
                        post, created = Post.objects.get_or_create(title=title, defaults=defaults)
                        if has_m2m(Post, "tags"):
                            chosen = random.sample(tag_objs, k=random.randint(0, min(3, len(tag_objs))))
                            if created or post.tags.count() == 0:
                                post.tags.set(chosen)
                        post_objs.append(post)
            else:
                self.stdout.write(f"Creating {total_posts} posts across authors…")
                for i in range(int(total_posts)):
                    prof = random.choice(authors_profiles)
                    title = f"{random.choice(TITLES)} (#{i+1})"
                    data = {"title": title}
                    data.update(make_post_defaults(prof))
                    post = Post.objects.create(**data)
                    if has_m2m(Post, "tags"):
                        post.tags.set(random.sample(tag_objs, k=random.randint(0, min(3, len(tag_objs)))))
                    post_objs.append(post)
        else:
            self.stdout.write(self.style.WARNING(
                "No non-admin authors found; skipping posts/comments/likes."
            ))

        # ---------- comments ----------
        if post_objs and authors_profiles and has_field(Comment, "post") and has_field(Comment, "author"):
            if total_comments is None:
                self.stdout.write("Creating 0–2 comments per post…")
                for post in post_objs:
                    commenters = [p for p in authors_profiles if p != post.author] if has_field(Post, "author") else authors_profiles
                    for _ in range(random.randint(0, 2)):
                        if not commenters:
                            break
                        cprof = random.choice(commenters)
                        kwargs = {"post": post, "author": cprof}
                        if has_field(Comment, "text"):
                            kwargs["text"] = f"Nice post, {getattr(post.author.user, 'username', 'author')}!"
                        Comment.objects.get_or_create(**kwargs)
            else:
                self.stdout.write(f"Creating {total_comments} comments total…")
                for i in range(int(total_comments)):
                    post = random.choice(post_objs)
                    commenters = [p for p in authors_profiles if p != post.author] if has_field(Post, "author") else authors_profiles
                    if not commenters:
                        continue
                    cprof = random.choice(commenters)
                    kwargs = {"post": post, "author": cprof}
                    if has_field(Comment, "text"):
                        kwargs["text"] = (f"Comment #{i+1}" if not fake else fake.sentence())
                    Comment.objects.create(**kwargs)

        # ---------- likes ----------
        if post_objs and authors_profiles and has_field(PostUserLikes, "post") and has_field(PostUserLikes, "user"):
            if total_likes is None:
                self.stdout.write("Creating 0–N likes per post…")
                for post in post_objs:
                    likers = random.sample(authors_profiles, k=random.randint(0, len(authors_profiles)))
                    for lp in likers:
                        PostUserLikes.objects.get_or_create(post=post, user=lp)
            else:
                self.stdout.write(f"Creating {total_likes} likes total…")
                for _ in range(int(total_likes)):
                    post = random.choice(post_objs)
                    lp = random.choice(authors_profiles)
                    PostUserLikes.objects.get_or_create(post=post, user=lp)

        # ---------- summary ----------
        out = {
            "users": User.objects.count(),
            "profiles": UserProfile.objects.count(),
            "tags": Tag.objects.count(),
            "posts": Post.objects.count(),
            "comments": Comment.objects.count(),
            "likes": PostUserLikes.objects.count(),
        }
        self.stdout.write(self.style.SUCCESS(f"Seeded ✅  {out}"))

        # ---------- credentials note (no plaintext in stdout) ----------
        try:
            if generated:
                creds = [
                    "# Demo credentials (generated)",
                    f"PASSWORD={demo_password}",
                    "USERS=admin,demo,alice,bob",
                    "",
                    "Note: additional extra users (if any) share the same password.",
                ]
                creds_note_path.write_text("\n".join(creds), encoding="utf-8")
                self.stdout.write(self.style.WARNING(
                    f"Demo credentials written to {creds_note_path} (not printed)."
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    "Demo credentials set via DEMO_PASSWORD env (not printed)."
                ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Could not persist demo credentials file: {e!r}"
            ))

    def _confirm(self, prompt: str) -> bool:
        try:
            return input(prompt).strip().lower() in {"y", "yes"}
        except EOFError:
            return False
