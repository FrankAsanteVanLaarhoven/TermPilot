"""Request dependencies."""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings import get_settings
from app.storage.database import get_session_factory


async def db_session() -> AsyncIterator[AsyncSession]:
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def current_user_id(x_user_id: str | None = Header(default=None, alias="X-User-Id")) -> str:
    return x_user_id or get_settings().demo_user_id
