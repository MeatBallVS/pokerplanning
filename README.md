# Planning Poker

Готовый full-stack проект для покер-планирования: React/Vite frontend, FastAPI backend, PostgreSQL, realtime-обновления через WebSocket и demo seed-данные.

## Что внутри

- Frontend: React, TypeScript, Vite, React Query, Redux Toolkit, Tailwind CSS.
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT auth.
- Realtime: WebSocket-события для состояния комнаты и голосования.
- Docker: единый запуск frontend + backend + PostgreSQL.

## Быстрый запуск через Docker

Из корня проекта:

```bash
docker compose up --build
```

Если Docker установлен без Compose plugin, используйте совместимую команду:

```bash
docker-compose up --build
```

После старта:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Healthcheck: http://localhost:8000/health

Demo seed включён в `planning-poker-backend/.env`. Пароль demo-пользователей: `DemoPass123!`.

## Локальный запуск без Docker

Backend:

```bash
cd planning-poker-backend/backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Для локального backend без Docker поменяйте `DATABASE_URL` на локальную PostgreSQL-строку, например:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/planning_poker
```

Затем:

```bash
.venv\Scripts\alembic upgrade head
.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

По умолчанию frontend ждёт API на `http://localhost:8000/api/v1`. Для другого адреса создайте `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Проверки

```bash
npm run lint
npm run build
```

Backend:

```bash
cd planning-poker-backend/backend
.venv\Scripts\python -m compileall -q app alembic
```

## Production notes

- Перед публичным запуском замените `JWT_SECRET_KEY` в `planning-poker-backend/.env`.
- Ограничьте `CORS_ORIGINS` реальным доменом frontend.
- Для HTTPS поставьте reverse proxy перед frontend/backend или настройте TLS на уровне платформы.
