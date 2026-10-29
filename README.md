# TaskFlow

TaskFlow is a full-stack workspace and project management application. It helps teams organize workspaces, projects, tasks, team membership, and invitations, while giving each user a personal dashboard and task list.

## Features

- Account registration and login with JWT authentication.
- Workspace creation and management with owner, admin, member, and viewer roles.
- Workspace invitations, membership management, and role updates.
- Project creation and management, including creator attribution, archiving, and restoration.
- Task creation, assignment, filtering, search, priority, status, and due dates.
- A personal dashboard with task and project summaries and upcoming assigned tasks.
- Personal settings, including a profile name and profile picture.
- Light and dark themes, with theme preference saved in the browser.
- Debounced search in relevant list views.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Zustand, Axios, Tailwind CSS 4, Lucide |
| Backend | Node.js, Express |
| Relational data | MySQL through `mysql2` |
| Avatar storage | MongoDB through the official Node.js driver |
| Authentication | JSON Web Tokens (`jsonwebtoken`) and `bcryptjs` |

## Architecture

The repository is split into two independently run applications:

```text
.
├── backend_tasks/
│   ├── db/                     # MongoDB connection helpers
│   ├── features/               # API routes and feature controllers
│   ├── midlewares/             # Authentication and workspace-role checks
│   ├── dummydata/              # Demo users, dataset, and seed scripts
│   ├── db.js                   # MySQL connection pool
│   └── server.js               # Express application and API mounting
└── frontend/
    └── src/
        ├── api/                # Axios client and API functions
        ├── components/         # Shared interface components
        ├── features/           # Feature-specific UI components
        ├── hooks/              # Shared React hooks
        ├── layouts/            # Authenticated and guest layouts
        ├── pages/              # Route-level screens
        └── stores/             # Client state, including authentication
```

### Data responsibilities

- **MySQL** stores application records, including users, workspaces, workspace membership, projects, invitations, and tasks.
- **MongoDB** stores profile-picture binary data and its content type. Avatar records are keyed by the user's numeric ID. No avatar image bytes are stored in the MySQL user row.
- **The browser** stores the JWT and username in local storage and sends the JWT as a bearer token on API calls. The theme preference is stored separately.

### Request and authorization flow

1. A user registers or logs in through the public user API. The backend verifies credentials (or hashes the new password), then returns a JWT.
2. The frontend auth store saves the token and the route guards restrict application pages to signed-in users.
3. The shared Axios client attaches the bearer token to API requests.
4. The backend verifies the JWT in its authentication middleware. Workspace-scoped routes can additionally check the user's workspace membership and role.
5. Feature controllers read or update MySQL records. Avatar endpoints use MongoDB for image data.

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` and a compatible npm version (required by the installed Vite version).
- A MySQL database with the TaskFlow schema created.
- MongoDB access if you want to use profile-picture uploads.

The repository does not currently include a MySQL schema migration or initialization script. Provision the database and required tables before starting the backend. The project-creation API and demo-data seeder also expect the `projects.created_by` column and its foreign key to `users.id` to exist.

### Install dependencies

```bash
cd backend_tasks
npm install

cd ../frontend
npm install
```

### Configure the backend

Create `backend_tasks/.env` with the connection details for your own development services:

```dotenv
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_taskflow_database

# Required only for profile-picture storage:
MONGODB_URI=mongodb://127.0.0.1:27017
# Optional; if omitted, the URI's default database is used.
MONGODB_DB_NAME=taskflow
# Optional; defaults to user_avatars.
MONGODB_AVATAR_COLLECTION=user_avatars
```

Keep real credentials in local environment files; do not commit them. `.env` files are ignored by Git. Use a unique, unpredictable `JWT_SECRET` outside local development.

### Configure the frontend

Create `frontend/.env` and set the API base URL to the backend origin:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

### Run locally

Start the backend in one terminal:

```bash
cd backend_tasks
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite in your terminal. The backend root route (`/`) responds with a simple server check.

## API overview

The API is mounted under `/api`. Routes are defined in `backend_tasks/features/`.

| Area | Base path | Capabilities |
| --- | --- | --- |
| Users | `/api/users` | Register, log in, search users, get/update the current user's name, and upload/read/delete the current user's avatar |
| Workspaces | `/api/workspaces` | List, create, read, update, and delete workspaces |
| Workspace members | `/api/workspaces/members` | List members, update member roles, remove members, or leave a workspace |
| Invitations | `/api/invitations` | Create/list/revoke workspace invitations and list, accept, or decline pending invitations |
| Projects | `/api/workspaces/:workspaceId/projects` | List, create, read, update, delete, archive, and restore projects |
| Tasks | `/api/tasks` | List assigned tasks, list/filter/search project tasks, and create/read/update/delete or assign tasks |
| Dashboard | `/api/dashboard/summary` | Return the signed-in user's dashboard summary |

Most application endpoints require a valid bearer token. Workspace and project operations also apply role checks where configured. Consult the corresponding route and controller files for exact request and response shapes.

## Demo data

The backend includes demo users and an idempotent demo-workspace seeder:

```bash
cd backend_tasks
npm run seed:dummy-users
node dummydata/seedDemoData.js
```

The demo workspace seeder requires a local-loopback `DB_HOST`, validates the schema, and uses a transaction. The loopback check does **not** prove that the configured database is disposable. Confirm the selected database and its contents before running either seeder; do not use demo credentials or data in production. The workspace seeder adds missing demo workspaces, memberships, projects, and tasks without deleting existing rows.

## Development scripts

### Frontend (`frontend/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Backend (`backend_tasks/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API with Node.js |
| `npm run seed:dummy-users` | Insert demo users that are not already present |

There is no configured automated backend test suite yet; its current `npm test` script is a placeholder.

## Further development

- Keep database credentials, JWT secrets, and production configuration out of source control.
- Apply and verify schema changes before deploying code that depends on them.
- Add automated API and UI tests as features evolve.
- For production deployment, configure restrictive CORS origins, HTTPS, secure token handling, database backups, and monitoring.
