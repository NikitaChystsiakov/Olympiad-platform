# Docker

The whole stack (Postgres, Spring Boot API, nginx with the built frontend) runs with Docker Compose.

```bash
cp .env.example .env
# set APP_JWT_SECRET, e.g. the output of: openssl rand -base64 48
docker compose -p olympiad-platform up -d --build
```

Compose refuses to start without `APP_JWT_SECRET` — there is no built-in default secret.

After the backend health check passes (about a minute on the first build):

| What | URL |
| --- | --- |
| App | http://localhost:3000 |
| API | http://localhost:8080/api |
| Health | http://localhost:8080/actuator/health |
| Postgres from the host | `localhost:15432`, user `postgres` |

nginx serves the SPA and proxies `/api/` to the backend, so the browser never calls the API cross-origin.

Flyway applies the schema and demo data (migration `V6__demo_content.sql`) on first start. Demo accounts: `student@test.com / student123`, `org@test.com / org123`, `admin@test.com / admin123`.

## Common commands

```bash
# logs
docker compose -p olympiad-platform logs -f backend

# stop
docker compose -p olympiad-platform down

# stop and wipe the database and uploaded files (demo data is re-created on next start)
docker compose -p olympiad-platform down -v
```

## Variables

All variables are listed in `.env.example`. The ones Compose reads:

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_JWT_SECRET` | — (required) | Base64 HMAC key, at least 256 bits |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Origins allowed to call the API directly |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | empty | Google sign-in; the button is hidden when empty |
| `JUDGE0_URL` | `https://ce.judge0.com` | Code execution sandbox |
| `NAGER_DATE_URL` | `https://date.nager.at` | Public-holiday warnings |

Uploaded files are stored in the `uploads_data` volume.
