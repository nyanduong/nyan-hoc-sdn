# Assignment 4 — Bugdesk

**Member code:** nhandtce190741  
**Project name:** assignment4_nhandtce190741

Frontend SPA for the Bug Report Management System. Uses the existing Assignment 3 backend without changing its API contracts or source code.

## Requirements

- Node.js 22.12+ (Node.js 24 also supported), npm.
- Existing Assignment 3 backend and its configured MongoDB database.
- Existing `admin`, `moderator`, and `user` role documents in the Assignment 3 database, as required by that backend's registration controller.

## Install and run

1. Start the existing Assignment 3 backend in a separate terminal:

   ```powershell
   cd ..\..\Assignment3\assignment3_nhandtce190741
   npm install
   npm start
   ```

   Its existing `.env` must configure `PORT=8002`, `MONGO_URI`, and `JWT_SECRET`. Keep real credentials in the backend; do not copy them into the frontend.

2. In this frontend folder:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the local URL printed by Vite, normally **http://127.0.0.1:5173**.

**Backend URL:** http://localhost:8002

The browser calls `/api`; Vite forwards these requests to the existing backend and removes the `/api` prefix. For example `/api/users/signin` reaches `http://localhost:8002/users/signin`. This avoids cross-origin browser restrictions without modifying Assignment 3.

Optional configuration: copy `.env.example` to `.env`. `BACKEND_URL` changes the proxy target. Keep `VITE_API_BASE_URL=/api` for local use. Restart Vite after changing environment variables. To use a direct backend URL in production, that server must support the frontend's origin through CORS.

## Build and verify

```powershell
npm test
npm run build
npm run preview
```

The preview server also proxies `/api` to Assignment 3. A production static host needs an equivalent reverse proxy for `/api`, plus a fallback to `index.html` for SPA routes. The `dist` folder contains the production build.

## Pages and API contracts

| Route             | Access             | API                                                                    |
| ----------------- | ------------------ | ---------------------------------------------------------------------- |
| `/signup`         | Public             | `POST /users/signup` with username, email, password, role              |
| `/signin`         | Public             | `POST /users/signin` with email, password                              |
| `/reports`        | Signed-in accounts | `GET /reports`                                                         |
| `/reports/create` | Admin only         | `POST /reports` with title, description, severity, project, assignedTo |

- Roles: `admin`, `moderator`, `user`.
- Severity: `low`, `medium`, `high` (matches the Assignment 3 model).
- `GET /reports` returns an array of reports assigned to the authenticated account. The UI displays only this response; it never fetches a global report list.
- Assignment 3 populates `assignedTo` with `_id`, `username`, `email`. The table displays the username.
- The create form accepts an existing **User** account's MongoDB ID (24 hexadecimal characters). No unlisted users endpoint is assumed.
- The backend sets the default status to `open`; the frontend does not submit a status.
- Reports assigned to another user will appear in that user's reports page, not in the Admin creator's list. An empty Admin list is expected.

## Authentication

The JWT is stored under `bugdesk.token` in localStorage. The backend returns `{ message, token }`; the frontend reads `id`, `email`, `role`, and `exp` from the token payload for UI routing. Decoding does not verify the signature: Assignment 3 remains responsible for authentication and authorization.

Axios attaches `Authorization: Bearer <token>` to protected requests. Missing, invalid, or expired local tokens and protected HTTP 401 responses clear authentication and send the user to sign in. Expiry is also handled while the page is open, and storage changes synchronize login/logout across tabs. Sign out clears the token and state, but does not revoke a JWT on the backend.

Non-Admin direct navigation to `/reports/create` shows 403 Forbidden. Backend Admin checks are still required and retained.

## Project structure

```text
src/
  api/client.js          Axios instance, auth interceptors, errors
  services/             API functions and JWT/session helpers
  context/              Shared authentication state
  routes/               Authentication and Admin route guards
  components/           Layout, inline icons, feedback
  pages/                Sign in/up, reports, creation, forbidden
  App.jsx               Routes and 404 handling
  main.jsx              React entry, Bootstrap, global CSS
  styles.css            Responsive visual design
  app.test.jsx          Auth, permission, API and state tests
```

## Demo checklist

1. Register a `user` account and an `admin` account on `/signup`. Show validation and successful registration. A duplicate email demonstrates a backend error.
2. Sign in as the User. Expand **My account ID** in the sidebar and copy its ID. Sign out.
3. Sign in as Admin. Open **Create report**, fill all fields, paste the User ID, and submit. Show success and the default Open status.
4. Sign out and sign in as the User. Show the report's Title, Project, Severity, Status, and populated Assigned To username.
5. Sign in as a different User to show that the report is not visible to that account.
6. As a User or Moderator, open `/reports/create` directly. Show 403 Forbidden and the absence of Admin navigation.
7. Show loading (DevTools network throttling), empty results, search/filter states, and errors (stop backend, then Refresh). An invalid JWT that has a readable payload demonstrates backend 401 handling.
8. Test phone width and desktop width. Sign out and verify `/reports` returns to sign in.

If the lecturer provides a screenshot template, capture the required screens from your running backend using that template. UI tests use controlled responses and do not replace a real-backend demonstration.

## Verification and screenshots

Verified with the existing Assignment 3 backend and its MongoDB database:

- Registration, login, logout, Admin report creation and the default `open` status.
- Populated assignee display and isolation between two User accounts.
- Frontend 403 protection, backend 403 rejection and backend 401 session clearing.
- Desktop (1440px) and mobile (390px) layouts; no uncaught browser errors.
- Nine automated integration tests pass; production build succeeds.

The `screenshots/` folder contains eight captures from this live verification: sign in, sign up, empty reports, report creation, creation success, populated reports, mobile layout and Forbidden. The temporary QA accounts and report shown in these screenshots were removed after verification. Use your own accounts for the classroom demonstration.

## Submission

Submit a ZIP named **assignment4_nhandtce190741.zip** containing this source folder, README, package lock, configuration and any required screenshots. **Exclude `node_modules`, `dist`, local `.env`, and test run artifacts.** The backend is reused from Assignment 3 and is not copied into this frontend.

The interface uses Bootstrap with custom responsive styles and inline SVG icons. Google Fonts is optional; system font fallbacks keep the app usable offline. No frontend secrets or third-party API keys are required.
