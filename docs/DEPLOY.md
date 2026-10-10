# Deploy

A free-tier setup that works for a portfolio demo:

| Part | Where | Notes |
| --- | --- | --- |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) Postgres | Flyway creates the schema and demo data on first start |
| Backend | [Render](https://render.com), [Railway](https://railway.app) or [Fly.io](https://fly.io) — Docker | `backend/olimpiad-platform/Dockerfile` |
| Frontend | [Vercel](https://vercel.com) | `frontend/vercel.json` proxies `/api/*` to the backend |

The browser only talks to the Vercel domain: `/api/*` is rewritten to the backend, so no CORS setup is needed in this layout.

## 1. Database

Create a Postgres database (version 15+). From the connection string, take host, database, user and password and build a JDBC URL:

```text
jdbc:postgresql://<host>/<database>?sslmode=require
```

Use the direct (non-pooled) host for Neon: Flyway migrations do not work well through PgBouncer in transaction mode.

## 2. Backend

Create a web service from this repository with:

- Root directory: `backend/olimpiad-platform`
- Runtime: Docker (the Dockerfile builds the jar with JDK 21 and runs it on a JRE)
- Health check path: `/actuator/health`

Environment variables:

| Variable | Value |
| --- | --- |
| `SPRING_DATASOURCE_URL` | the JDBC URL from step 1 |
| `SPRING_DATASOURCE_USERNAME` | database user |
| `SPRING_DATASOURCE_PASSWORD` | database password |
| `APP_JWT_SECRET` | output of `openssl rand -base64 48` — required, never reuse the local one |
| `APP_CORS_ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://olympus-proctor.vercel.app` (only used if the browser calls the API directly) |
| `APP_UPLOAD_DIR` | `/app/uploads` (or a mounted disk path, see below) |
| `JAVA_TOOL_OPTIONS` | `-XX:MaxRAMPercentage=75` on 512 MB instances |
| `GOOGLE_CLIENT_ID` | optional, enables Google sign-in |

The server listens on `$PORT` when the platform sets it, otherwise on 8080.

Check it: `https://<backend-host>/actuator/health` should return `{"status":"UP"}`.

> **Uploaded files are ephemeral on free tiers.** Render, Railway and Fly wipe the container filesystem on every deploy or restart, so attachments to manual-review answers disappear. For a demo this is acceptable; for real use mount a persistent disk at `APP_UPLOAD_DIR` (Render Disk, Fly volume, Railway volume — all paid or limited) or move storage to S3-compatible object storage.

> **Cold starts.** Free Render services sleep after ~15 minutes without traffic; the first request then takes 30–60 seconds. Open the backend URL once before showing the demo.

## 3. Frontend

1. In `frontend/vercel.json`, replace `https://YOUR-BACKEND-HOST` with the backend URL from step 2 (no trailing slash).
2. Import the repository into Vercel with **Root Directory** `frontend`. Framework, build command and output directory are taken from `vercel.json`.
3. Optional environment variable: `VITE_GOOGLE_CLIENT_ID` (the same client ID as on the backend; add the Vercel domain to the OAuth client's authorized JavaScript origins).

The second rewrite (`/(.*)` → `/index.html`) is the SPA fallback: Vercel serves real files first, so `/assets/*` and `/models/*` (face detection weights) are not affected.

### Alternative: call the backend directly

If you prefer not to proxy through Vercel (for example, to avoid its request body limits on large uploads), remove the `/api` rewrite, set `VITE_API_BASE_URL=https://<backend-host>/api` in Vercel, and set `APP_CORS_ALLOWED_ORIGINS` on the backend to the Vercel URL.

## 4. After the first deploy

- Log in with the demo buttons on the landing page (`student@test.com`, `org@test.com`, `admin@test.com`).
- Demo data lives in migration `V6__demo_content.sql`. To reset it, drop and recreate the database; Flyway re-applies everything on the next start.
- Demo passwords are public by design. If the deployment is shared beyond a demo, change them or remove `V6`.
