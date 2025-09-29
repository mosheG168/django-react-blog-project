# 📝 Django + React Blog App

A modern **full-stack blog demo** built with **Django REST Framework** (backend) and **React + Vite + Material UI** (frontend).  
Supports JWT authentication, role-based permissions, post CRUD with category tags, likes, comments, and filtering.

---

## 🚀 Features

### Backend (Django + DRF)

- Django REST Framework API
- JWT authentication with [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- Role-based permissions:
  - **Admins** can create/update/delete posts, delete comments, manage users
  - **Users** can register/login, like/unlike posts, comment
  - Everyone can browse posts
- Tags system (case-insensitive, auto-create on demand)
- Post likes with `likes_count`, `liked_by_me`, and (for admins/authors) list of likers
- Comment replies and ownership checks
- Pagination, filtering, search, ordering
- CORS ready

### Frontend (React + Vite + MUI)

- React 18 + Vite dev server
- Material UI with light/dark mode toggle
- Authentication flow (login/register/logout) with token storage and auto-refresh
- Protected routes (only admins can access “New Post” and “My Posts”)
- CRUD UI for posts
- Rich filtering:
  - Search posts by text, author, or tag (`#tag` support)
  - Sort by date, title, or likes
- Like/unlike posts with live counters
- Add/delete comments
- Toast notifications via [notistack](https://iamhosseindhv.com/notistack)

---

## 📂 Project Structure

project-root/
├── backend/ (Django project)
│ ├── api/ # Django app with models, views, serializers, permissions
│ ├── finalproject/ # Django project settings
│ ├── manage.py
│ └── requirements.txt
└── frontend/ (React + Vite app)
├── src/
│ ├── api/ # Axios clients for posts, tags, comments, auth
│ ├── components/ # Shared UI components
│ ├── context/ # Auth context provider
│ ├── pages/ # Page components (Home, PostDetail, NewPost, etc.)
│ └── App.jsx
├── index.html
├── package.json
└── vite.config.js

---

## ⚙️ Setup

### 1. Backend (Django)

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # Linux/macOS
   .venv\Scripts\activate      # Windows

   ```

2. Install dependencies:
   pip install -r requirements.txt

3. Run migrations and create a superuser:
   python manage.py migrate
   python manage.py createsuperuser

4. Start the dev server:
   python manage.py runserver
   API runs at: http://localhost:8000/api/

5. Frontend (React + Vite)

   1. Install dependencies:
      cd frontend
      npm install

   2. Create a .env file:
      VITE_API_URL=http://localhost:8000

   3. Start the dev server:
      npm run dev
      App runs at: http://localhost:5173

🔑 Authentication

Register: /api/auth/register/

Login: /api/auth/login/ → returns { access, refresh }

Refresh: /api/token/refresh/

Current user: /api/me/

Frontend stores tokens in localStorage and auto-refreshes access when expired.

📡 API Highlights

GET /posts/ → list posts (supports search, tag, ordering, pagination)

GET /posts/{id}/ → post detail (includes likes_count, liked_by_me)

POST /posts/ → create post (admin only, requires tag_inputs)

PATCH /posts/{id}/ → edit post (admin only)

DELETE /posts/{id}/ → delete post (admin only)

POST /comments/ → add comment

DELETE /comments/{id}/ → delete comment (admin or owner)

POST /post-user-likes/ → like post

DELETE /post-user-likes/{post_id}/by-post/ → unlike

GET /posts/mine/ → list my posts (admin only)

🛠️ Tech Stack

Backend: Python, Django, Django REST Framework, SimpleJWT, PostgreSQL (or SQLite for dev)

Frontend: React, Vite, Material UI, Axios, notistack

Other: Docker-ready (optional), CORS middleware

📜 License

MIT License — free to use, modify, and distribute.
