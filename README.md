# ProjectPool

A project discovery library for college students. Browse practical project ideas, search by topic or tool, save ideas for later, and open a project brief with suggested features and deliverables.

## Stack

- Frontend: React, Vite, Tailwind CSS, shadcn/ui conventions, Lucide
- Backend: Node.js, Express, Mongoose
- Database: MongoDB

## Run locally

1. Install dependencies from the repository root: `npm install`, `npm install --prefix frontend`, and `npm install --prefix backend`.
2. Copy `backend/.env.example` to `backend/.env`. Set `JWT_SECRET` to a unique random secret (at least 32 characters). The local demo uses a separate `ProjectPoolDemo` database. Set `MONGODB_URI` to your local or Atlas connection string if needed; `MONGODB_DB` selects the database name.
3. Start both applications with `npm run dev`.
4. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

The API runs at `http://localhost:5000`. `GET /api/health` is the liveness endpoint; `GET /api/ready` reports whether MongoDB is connected. Public starter data is available in development when MongoDB is offline, but account and write features require MongoDB.

## App pages

- `/` is project discovery.
- `/projects/:id` is a shareable project detail page.
- `/saved` and `/submissions` are signed-in student workspaces.
- `/profile` shows the signed-in user's profile and workspace shortcuts.
- `/account` contains profile and password settings.
- `/submit` is the project submission form.
- `/manage` is the admin catalog and moderation page.
- `/login` and `/register` are standalone account pages.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` provide accounts without email verification. Sessions use HttpOnly cookies.
- `GET /api/projects` supports `category`, `difficulty`, `q`, `page`, `limit`, and `sort` query parameters; only approved projects are public.
- Signed-in students can submit projects with `POST /api/projects`, manage their submissions with `GET /api/projects/mine`, and save ideas through `/api/users/saved`.
- Moderators can inspect `GET /api/projects/moderation` and approve/reject via `PATCH /api/projects/:id/review`.
- Admin project management uses `/api/projects/admin` and `/api/projects/admin/all`.
- `GET /api/health` reports liveness; `GET /api/ready` reports database readiness.

Create the local showcase administrator with `npm --prefix backend run admin:create`. By default it creates `admin@projectpool.local` in the `ProjectPoolDemo` database, generates a strong password, and stores the sign-in details in the ignored `backend/.demo-admin-credentials.txt` file. Open that local file to sign in. To choose your own credentials, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` first; passwords must be at least 12 characters. API tests run with `npm run test:api`.

For a presentation walkthrough, set `DEMO_STUDENT_EMAIL` and `DEMO_STUDENT_PASSWORD` in `backend/.env`, then run `npm --prefix backend run demo:seed`. This seeds twelve catalog projects, one pending student submission, and one saved idea into the dedicated `ProjectPoolDemo` database. The script refuses to run against a database name without `Demo` in it. Sign in as the student to submit ideas, then use the admin account to review them.

Guest saves remain in browser storage; signed-in saves are stored in MongoDB. Email verification and email-based password recovery are intentionally not enabled.