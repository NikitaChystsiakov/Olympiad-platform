# Olympiad Proctoring Platform

Платформа для онлайн-олимпиад с JWT-авторизацией, ролями, участием студентов, модулем прокторинга и админским управлением пользователями.

## Технологии

- Backend: Java 21, Spring Boot 3.2.2, PostgreSQL 15, Redis, JWT, Maven, Flyway
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Axios
- Infrastructure: Docker Compose, Nginx

## Быстрый Запуск

```bash
docker compose -p olympiad-platform up -d --build
```

После запуска:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- PostgreSQL: `localhost:15432`
- Redis: `localhost:16379`

Остановить контейнеры:

```bash
docker compose -p olympiad-platform down
```

Остановить и удалить данные БД/Redis:

```bash
docker compose -p olympiad-platform down -v
```

## Начальные Данные

Flyway-миграции создают схему, пользователей всех ролей и опубликованную демо-олимпиаду с вопросами.

| Роль | Email | Пароль |
| --- | --- | --- |
| ADMIN | `admin@test.com` | `admin123` |
| ORGANIZER | `org@test.com` | `org123` |
| STUDENT | `student@test.com` | `student123` |
| STUDENT | `student2@test.com` | `student123` |
| STUDENT | `student3@test.com` | `student123` |

Демо-олимпиада:

- Название: `Demo Programming Olympiad`
- Статус: `PUBLISHED`
- Организатор: `org@test.com`
- Вопросы: single choice, multiple choice, text

Если контейнеры уже запускались до добавления миграций, пересоздайте volume:

```bash
docker compose -p olympiad-platform down -v
docker compose -p olympiad-platform up -d --build
```

## Логика Олимпиады

У олимпиады есть окно старта: `startTime` и `endTime`. Студент может начать выполнение в любой момент внутри этого окна.

После старта попытки таймер считается индивидуально: `startedAt + durationMinutes`. Например, если олимпиада доступна для старта с 10:00 29 апреля до 12:00 30 апреля и длится 2 часа, студент может начать в 11:30 30 апреля и получит свои 2 часа.

Повторный старт:

- если у студента уже есть активная попытка, API вернет ее;
- если предыдущая попытка завершена, в окне старта можно создать новую попытку.

## Админка

Администратор может открыть раздел `Пользователи` в верхнем меню или перейти на:

```text
http://localhost:3000/admin/users
```

Доступные действия:

- просмотр списка пользователей с поиском и фильтром по роли;
- добавление пользователя;
- изменение email, ФИО, пароля, роли и активности;
- удаление пользователя, кроме собственного аккаунта администратора.

## Проверки

Backend:

```bash
cd backend/olimpiad-platform
mvn clean test
```

Frontend:

```bash
cd frontend
npm install
npm run build
```
## External APIs

- Google Sign-In: set `GOOGLE_CLIENT_ID` for backend token audience validation and `VITE_GOOGLE_CLIENT_ID` for the frontend button.
- Nager.Date public holidays: `/api/calendar/holidays`, configurable by `NAGER_DATE_URL`. The create/edit olympiad form uses it to warn organizers about public holidays in the start window.
- Judge0 code execution: `/api/code/run`, configurable by `JUDGE0_URL`. The UI is available at `/code-runner`.
