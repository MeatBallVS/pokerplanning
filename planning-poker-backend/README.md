# Poker Planning Backend

Бэкенд учебного проекта по покер-планированию на FastAPI и PostgreSQL.

## Состав проекта

- `backend/` - исходный код API
- `docker-compose.yml` - локальный запуск API и PostgreSQL
- `.env` - готовая конфигурация для локальной разработки
- `.env.example` - шаблон переменных окружения

## Запуск

1. Перейдите в каталог проекта:

   ```bash
   cd planning-poker-backend
   ```

2. При необходимости измените значения в `.env`.

3. Запустите сервисы:

   ```bash
   docker compose up --build
   ```

4. После запуска будут доступны:

   - API: `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`
   - Healthcheck: `http://localhost:8000/health`

При старте автоматически применяются миграции Alembic.

## Полезные команды

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить volume базы данных:

```bash
docker compose down -v
```

Запустить сервисы в фоне:

```bash
docker compose up --build -d
```

## Переменные окружения

Основные настройки находятся в `.env`.

Чаще всего меняют:

- `BACKEND_PORT`
- `POSTGRES_PORT`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS`
- `SEED_DEMO_DATA`

## Локальная разработка

- backend запускается в режиме `--reload`;
- исходный код из каталога `backend/` примонтирован в контейнер;
- изменения в Python-файлах подхватываются автоматически.
