"""TermPilot FastAPI application."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.ops import ops
from app.api.router import router
from app.observability.logging import configure_logging, get_logger
from app.services.demo import reset_demo
from app.settings import get_settings
from app.storage.database import init_db

log = get_logger("termpilot.api")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    settings = get_settings()
    await init_db()
    if settings.env == "demo":
        try:
            await reset_demo()
        except Exception as exc:  # noqa: BLE001
            log.warning("demo_seed_skipped", error=str(exc))
    if settings.sentry_dsn:
        try:
            import sentry_sdk

            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                traces_sample_rate=settings.sentry_traces_sample_rate,
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("sentry_init_failed", error=str(exc))
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="TermPilot",
        version="0.1.0",
        description="Verified control tower for student life.",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(router)
    application.include_router(ops)

    hits: dict[str, int] = {}

    @application.middleware("http")
    async def add_correlation(request: Request, call_next):  # type: ignore[no-untyped-def]
        ip = request.client.host if request.client else "local"
        hits[ip] = hits.get(ip, 0) + 1
        if hits[ip] > 20000:
            return JSONResponse({"router": {"code": "rate_limited", "route": "backoff"}}, status_code=429)
        response = await call_next(request)
        response.headers["X-TermPilot"] = "termpilot"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    return application


app = create_app()
