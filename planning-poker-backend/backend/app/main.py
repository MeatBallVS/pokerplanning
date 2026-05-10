from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth_router, invitation_router, rooms_router, voting_router, ws_router
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.demo_seed_service import seed_demo_data
from app.services.seed_service import seed_default_decks

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    with SessionLocal() as db:
        seed_default_decks(db)
        seed_demo_data(db)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(rooms_router, prefix=settings.api_v1_prefix)
app.include_router(invitation_router, prefix=settings.api_v1_prefix)
app.include_router(voting_router, prefix=settings.api_v1_prefix)
app.include_router(ws_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
