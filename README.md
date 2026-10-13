# ProjectPool

ProjectPool is a project discovery and submission platform for college students. It helps students find practical ideas, understand what each project involves, save work they want to revisit, and share their own proposals with a campus community.

The repository contains a React web client and an Express API backed by MongoDB. The API supports student accounts, saved projects, project submissions, review workflows, and catalog analytics.

## Features

- Browse a curated catalog of student-sized project ideas across six fields: web development, AI and machine learning, mobile apps, IoT and hardware, data and visualization, and cybersecurity.
- Search by project details, tools, skills, and tags. Filter by category and difficulty; sort by newest, shortest timeline, or beginner level.
- Explore trending ideas and recommendations, or choose a surprise project from the current results.
- Open a full project brief with scope, features, suggested technology, team size, estimated cost, prerequisites, learning outcomes, milestones, and deliverables.
- Ask common questions about a project using the local project Q&A guide. It matches questions to information in the brief and does not call an AI provider yet.
- Organize approved ideas into named collections such as “Semester Project” and “Learning Projects,” then share a public link or return the collection to private.
- Track milestone progress per project. Signed-in progress syncs to the account; guest progress stays in the current browser.
- Review the last eight projects opened in this browser, or compare up to three projects across timelines, difficulty, tools, skills, costs, and deliverables.
- Suggest corrections to project information. Administrators can review, resolve, dismiss, or reopen submitted reports.
- Save and share project links, and download a project brief as a PDF.
- Keep guest saves in the current browser, or sign in to sync saved ideas and activity to the account.
- Submit project ideas for review, track their status, and edit pending or rejected submissions.
- Customize a profile with an avatar and areas of interest. The profile includes recommendations and a recent activity timeline.
- Review student submissions with moderator or administrator access. Administrators can also publish, edit, archive, and delete catalog projects.
- Use responsive layouts and a persistent light/dark theme preference.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Discover, search, and filter the project catalog. |
| `/projects/:id` | Shareable project details, related ideas, and project brief actions. |
| `/saved` | View saved projects. Requires sign-in. |
| `/recent` | View the last eight projects opened in this browser. |
| `/collections` | Create, organize, and share project collections. Requires sign-in. |
| `/collections/shared/:shareId` | View a public collection shared by its owner. |
| `/submissions` | View and update your submissions. Requires sign-in. |
| `/profile` | Manage profile appearance and interests, view recommendations and activity. Requires sign-in. |
| `/account` | Update display name or password, or delete the account. Requires sign-in. |
| `/submit` | Submit a project idea. Requires sign-in. |
| `/manage` | Review submissions or manage the catalog, depending on role. Requires moderator or administrator access. |
| `/dashboard` | View catalog, activity, difficulty, and saved-project analytics. |
| `/about` | Read about the platform and its architecture. |
| `/login`, `/register` | Sign in or create an account. |

## Roles and review states

New accounts have the `student` role. A student's submission starts as `pending`; moderators and administrators can approve or reject it, optionally adding a review note. The project owner can edit pending or rejected submissions, which returns them to review. Approved projects appear in the public catalog. Administrators can also create and edit catalog entries, archive projects, and delete projects.

Project statuses are `pending`, `approved`, `rejected`, and `archived`. Only approved projects are returned by public catalog and detail endpoints.

## Technology

- Frontend: React 19, React Router, Vite 8, Tailwind CSS 4, Recharts, Lucide icons, and Radix UI Slot.
- Backend: Node.js 22 (the CI runtime), Express 5, Mongoose 8, and MongoDB.
- Authentication: bcrypt password hashes and signed JWT sessions in an HTTP-only cookie.
- Tests: Node.js test runner and Supertest for the API; Oxlint for frontend linting.

## Repository layout

```text
backend/
	src/
		data/       Starter and showcase project data
		models/     Mongoose user and project models
		routes/     Authentication, user, and project API routes
		scripts/    Admin creation and demo seeding commands
	test/         API, authentication, and workflow tests
frontend/
	src/
		components/ Reusable pages, dialogs, and UI controls
		data/       Frontend starter project data
		hooks/      Shared React hooks
		lib/        API client and project brief helpers
.github/workflows/ci.yml
```

## Requirements

- Node.js 22 and npm. The CI workflow uses Node.js 22.
- MongoDB for accounts, saved projects, submissions, and persistent catalog data. A local MongoDB instance or an accessible MongoDB deployment can be used.

## Run locally

1. Install dependencies from the repository root:

	 ```sh
	 npm ci
	 npm ci --prefix frontend
	 npm ci --prefix backend
	 ```

2. Copy `backend/.env.example` to `backend/.env` and set a unique `JWT_SECRET` (use a randomly generated value of at least 32 characters). Confirm that `MONGODB_URI` and `MONGODB_DB` point to the database you intend to use. The example configuration targets a local database named `ProjectPoolDemo`.

3. Start the API and Vite development server:

	 ```sh
	 npm run dev
	 ```

4. Open `http://localhost:5173`. The frontend proxies `/api` requests to the backend at `http://localhost:5000` by default.

The backend requires `JWT_SECRET` and attempts to connect to MongoDB at startup. In development, if MongoDB is unavailable, the public project catalog can fall back to bundled starter projects. Accounts and database-backed write operations require a working database connection.

## Configuration

The backend loads environment values from `backend/.env` via dotenv.

| Variable | Purpose | Default or requirement |
| --- | --- | --- |
| `PORT` | API listening port. | `5000` |
| `MONGODB_URI` | MongoDB connection URI. | `mongodb://127.0.0.1:27017/ProjectPool` |
| `MONGODB_DB` | Database name passed to Mongoose. | `ProjectPool` |
| `JWT_SECRET` | Signs and verifies user sessions. | Required; use a unique secret of at least 32 characters. |
| `CLIENT_ORIGIN` | Allowed frontend origin for credentialed CORS. | `http://localhost:5173` |

The API uses the database name from `MONGODB_DB`, even if the URI also contains a database path. Keep development, demo, and production databases separate.

## API overview

All routes are prefixed with `/api`. Protected endpoints require the `projectpool_session` cookie. The interactive API page is available at `/api/docs`, with its OpenAPI document at `/api/openapi.json`.

### Health and documentation

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Returns API status and MongoDB connection state. |
| `GET` | `/api/ready` | Public | Returns readiness; responds with `503` while the database is unavailable. |
| `GET` | `/api/docs` | Public | Swagger UI. |
| `GET` | `/api/openapi.json` | Public | OpenAPI 3.0.3 document. |

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and start a session. Passwords must be 12-128 characters. |
| `POST` | `/api/auth/login` | Authenticate and start a session. |
| `POST` | `/api/auth/logout` | End the current session. Requires sign-in. |
| `GET` | `/api/auth/me` | Return the current account. Requires sign-in. |

### Projects

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | Public | Paginated approved catalog. |
| `GET` | `/api/projects/analytics` | Public | Catalog totals, categories, difficulty, submission activity, most-saved, and weekly trending data. |
| `GET` | `/api/projects/similar/:id` | Public | Find related approved projects. |
| `GET` | `/api/projects/:id` | Public | Get an approved project by ID. |
| `POST` | `/api/projects` | Student | Submit a project for review. |
| `GET` | `/api/projects/mine` | Signed-in user | List your submissions. |
| `PATCH` | `/api/projects/:id` | Submission owner | Edit a pending or rejected submission. |
| `DELETE` | `/api/projects/:id` | Submission owner or administrator | Delete an eligible submission or project. |
| `GET` | `/api/projects/moderation` | Moderator or administrator | List pending submissions. |
| `PATCH` | `/api/projects/:id/review` | Moderator or administrator | Approve or reject a pending submission. |
| `PATCH` | `/api/projects/moderation/bulk` | Moderator or administrator | Approve or reject up to 50 pending submissions. |
| `GET` | `/api/projects/admin/all` | Administrator | List catalog entries; accepts an optional `status` filter. |
| `POST` | `/api/projects/admin` | Administrator | Create an approved catalog entry. |
| `PATCH` | `/api/projects/:id/admin` | Administrator | Edit a catalog entry or change its status. |

Catalog queries accept `q`, `category`, `difficulty`, `tag`, `page`, `limit`, and `sort`. The page size defaults to 12 and is capped at 48. Supported sort values are `newest`, `oldest`, `title`, `shortest`, and `difficulty`.

Project submissions include a title, category, difficulty, duration, short description, and overview. Optional brief details include team size, estimated cost, impact, features, technology, deliverables, prerequisites, learning outcomes, milestones, skills, tags, and an HTTPS image URL with alt text.

### Users

All user routes below require sign-in.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/users/me` | Read the current profile. |
| `PATCH` | `/api/users/me` | Update display name, avatar, or up to 12 interests. |
| `PATCH` | `/api/users/me/password` | Change password and invalidate the current session. |
| `DELETE` | `/api/users/me` | Delete the account and its submitted projects; requires the current password. |
| `GET` | `/api/users/saved` | List saved approved projects. |
| `POST` | `/api/users/saved/:projectId` | Save an approved project. |
| `DELETE` | `/api/users/saved/:projectId` | Remove a saved project. |
| `GET` | `/api/users/activity` | Read recent saves and submissions. |

### Collections, project progress, and corrections

Collection management routes require sign-in. Collections are private by default; changing visibility creates a share link, and changing back to private revokes it. Public collection pages only include currently approved projects.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET`, `POST` | `/api/collections` | Signed-in user | List or create your collections. |
| `PATCH`, `DELETE` | `/api/collections/:collectionId` | Collection owner | Edit name, description, or visibility; delete a collection. |
| `POST`, `DELETE` | `/api/collections/:collectionId/projects/:projectId` | Collection owner | Add or remove an approved project. |
| `GET` | `/api/collections/shared/:shareId` | Public | Read a collection through its active share link. |
| `GET`, `PUT` | `/api/projects/:id/progress` | Signed-in user | Read or update completed milestone indexes. |
| `POST` | `/api/projects/:id/corrections` | Public | Submit an outdated-information report. |
| `GET` | `/api/projects/corrections` | Administrator | Review correction reports. |
| `PATCH` | `/api/projects/corrections/:reportId` | Administrator | Resolve, dismiss, or reopen a report. |

## Demo data and administrator account

To create a local administrator, run:

```sh
npm --prefix backend run admin:create
```

By default this uses `admin@projectpool.local` and generates a password, then writes the local sign-in details to `backend/.demo-admin-credentials.txt`. This file is ignored by Git. To choose credentials, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before running the command. Use this only with a local or otherwise isolated database.

To populate a presentation database with starter and showcase catalog projects, demo accounts, saved ideas, and sample submissions, set demo credentials in `backend/.env` and run:

```sh
npm --prefix backend run demo:seed
```

The script supports `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`, `DEMO_MODERATOR_EMAIL` / `DEMO_MODERATOR_PASSWORD`, `DEMO_STUDENT_EMAIL` / `DEMO_STUDENT_PASSWORD`, and `DEMO_BUILDER_EMAIL` / `DEMO_BUILDER_PASSWORD`. Demo passwords must be at least 12 characters. The seeder refuses to run unless `MONGODB_DB` contains `Demo` (case-insensitive); keep this data isolated from production. It can be rerun to upsert its sample records, but it does not clear unrelated database data.

## Development commands

Run these from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and frontend together. |
| `npm run dev:frontend` | Start only Vite. |
| `npm run dev:backend` | Start only the API with Node watch mode. |
| `npm run test:api` | Run backend API, authentication, and workflow tests. |
| `npm run lint` | Run Oxlint on the frontend. |
| `npm run build` | Create the frontend production build in `frontend/dist`. |

The GitHub Actions workflow installs all three dependency sets, then runs API tests, frontend lint, and the frontend production build.

## Security and current limitations

- Passwords are hashed with bcrypt. Sessions are signed JWTs stored in an HTTP-only, `SameSite=Strict` cookie with a seven-day lifetime; production cookies use the `Secure` flag.
- The backend uses Helmet, credentialed CORS restricted to `CLIENT_ORIGIN`, JSON request-size limits, and production API/auth rate limits.
- Email verification and email-based password recovery are not implemented. Do not use the demo account setup as a production identity flow.
- The project Q&A guide currently uses local question-and-answer matching. It does not send prompts to an AI model; a server-side API integration can replace the local answer function later.
- Guest saves and the theme preference are stored in browser local storage. Signed-in saved projects, profile data, and activity are stored in MongoDB.
- Demo seeding and administrator creation are intended for isolated development or presentation databases. Configure unique secrets and credentials before exposing any deployment.