# 📝 Django + React Blog App

_A modern **full-stack blog demo** built with Django REST Framework (backend) and React + Vite + Material UI (frontend)._

---

## ⚡ Quickstart (Demo Mode)

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # (Linux/macOS)
.venv\Scripts\activate      # (Windows)

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Run migrations + seed demo data
export DEMO_PASSWORD='Abc!12345'
export DEMO_DATA=1
python manage.py migrate
python manage.py seed_demo --fresh -y --seed 42

# 4. Start backend
python manage.py runserver   # http://localhost:8000/api/

# 5. Frontend setup (in another terminal)
cd blog-frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev   # http://localhost:5173
✅ Logins available immediately:

admin / Abc!12345

demo / Abc!12345

alice / Abc!12345

bob / Abc!12345

🚀 Features
Backend (Django + DRF)
Django REST Framework API

JWT authentication with SimpleJWT

Role-based permissions:

Admins can create/update/delete posts, delete comments, manage users

Users can register/login, like/unlike posts, comment

Everyone can browse posts

Tags system (case-insensitive, auto-create on demand)

Post likes with likes_count, liked_by_me, and (for admins/authors) list of likers

Comment replies and ownership checks

Pagination, filtering, search, ordering

CORS ready

Frontend (React + Vite + MUI)
React 18 + Vite dev server

Material UI with light/dark mode toggle

Authentication flow (login/register/logout) with token storage and auto-refresh

Protected routes (only admins can access “New Post” and “My Posts”)

CRUD UI for posts

Rich filtering:

Search posts by text, author, or tag (#tag support)

Sort by date, title, or likes

Like/unlike posts with live counters

Add/delete comments

Toast notifications via notistack

📂 Project Structure
text
Copy code
python-final-proj/
├── api/                # Django app with models, views, serializers, permissions
├── finalproject/       # Django project settings
├── blog-frontend/      # React + Vite frontend
│   ├── src/
│   │   ├── api/        # Axios clients for posts, tags, comments, auth
│   │   ├── components/ # Shared UI components
│   │   ├── context/    # Auth context provider
│   │   ├── pages/      # Page components (Home, PostDetail, NewPost, etc.)
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── manage.py
├── requirements.txt
└── .env
⚙️ Setup (Detailed)
Backend (Django)
Create and activate a virtual environment:

bash
Copy code
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
.venv\Scripts\activate      # Windows
Install dependencies:

bash
Copy code
pip install -r requirements.txt
Apply migrations:

bash
Copy code
python manage.py migrate
(Optional) Create a personal superuser:

bash
Copy code
python manage.py createsuperuser
Start the dev server:

bash
Copy code
python manage.py runserver
API runs at: http://localhost:8000/api/

Frontend (React + Vite)
Install dependencies:

bash
Copy code
cd blog-frontend
npm install
Create a .env file:

bash
Copy code
echo "VITE_API_URL=http://localhost:8000" > .env
Start the dev server:

bash
Copy code
npm run dev
App runs at: http://localhost:5173

📊 Demo Data
The project includes a seeding command to auto-create demo users, posts, tags, comments, and likes.

Option A – Set your own password (recommended):

bash
Copy code
export DEMO_PASSWORD='Abc!12345'
export DEMO_DATA=1
python manage.py seed_demo --fresh -y --seed 42
Option B – Let the tool generate one:

bash
Copy code
export DEMO_DATA=1
python manage.py seed_demo --fresh -y --seed 42
A strong random password will be generated and saved to .demo_credentials.txt.

Demo Accounts (if Option A used):

admin / Abc!12345

demo / Abc!12345

alice / Abc!12345

bob / Abc!12345

🔒 Production Notes
Do not use the demo seeder in production databases.

Always set DEBUG=False in .env for production.

Use a secure, unique SECRET_KEY.

Configure ALLOWED_HOSTS and a production database (e.g. PostgreSQL).

Seed demo data only with DEMO_DATA=1 (or --allow-prod) in controlled environments.

```
