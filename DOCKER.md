# Docker

Проект полностью запускается через Docker Compose:

```bash
docker compose -p olympiad-platform up -d --build
```

После запуска:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- PostgreSQL с хоста: `localhost:15432`
- Redis с хоста: `localhost:16379`

Flyway автоматически создаёт таблицы и добавляет seed-данные:

| Роль | Email | Пароль |
| --- | --- | --- |
| ADMIN | `admin@test.com` | `admin123` |
| ORGANIZER | `org@test.com` | `org123` |
| STUDENT | `student@test.com` | `student123` |

Также создаётся опубликованная демо-олимпиада `Demo Programming Olympiad`.

Внутри Docker-сети backend подключается к сервисам так:

- PostgreSQL: `postgres:5432`
- Redis: `redis:6379`

Остановить контейнеры:

```bash
docker compose -p olympiad-platform down
```

Остановить и удалить данные PostgreSQL/Redis:

```bash
docker compose -p olympiad-platform down -v
```

Эта команда нужна, если хочется заново применить миграции и seed-данные на чистую БД.

Посмотреть логи:

```bash
docker compose -p olympiad-platform logs -f backend
docker compose -p olympiad-platform logs -f frontend
```

Переменные окружения можно положить в `.env` рядом с `docker-compose.yml`.
Минимальный пример есть в `.env.example`.
