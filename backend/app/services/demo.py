"""Demo seed and reset. Synthetic data only."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.ics import IcsConnector
from app.domain.enums import ConsentPurpose, SourceType
from app.domain.ids import new_id
from app.domain.models import (
    CalendarEvent,
    ConsentGrant,
    SourceConnection,
    StudentPreference,
    UserProfile,
)
from app.services import clock
from app.settings import get_settings
from app.storage.database import drop_db, init_db, reset_engine

DEMO_USER_NAME = "Frank Van Laarhoven"
DEMO_USERNAME = "FAVL"


async def reset_demo(session: AsyncSession | None = None) -> dict[str, Any]:
    del session
    await reset_engine()
    await drop_db()
    await init_db()
    from app.storage.database import get_session_factory

    factory = get_session_factory()
    async with factory() as seeded:
        result = await seed_user(seeded)
        await seeded.commit()
        return result


async def seed_user(session: AsyncSession) -> dict[str, Any]:
    settings = get_settings()
    now = clock.now()
    user = UserProfile(
        id=settings.demo_user_id,
        display_name=DEMO_USER_NAME,
        timezone=settings.timezone,
        created_at=now,
        updated_at=now,
    )
    session.add(user)
    purposes = [
        (ConsentPurpose.SOURCE_READ, SourceType.LMS.value, "Read synthetic LMS assignments"),
        (ConsentPurpose.SOURCE_READ, SourceType.EMAIL.value, "Read selected forwarded mail"),
        (ConsentPurpose.SOURCE_READ, SourceType.CALENDAR.value, "Read demo ICS calendar"),
        (ConsentPurpose.SOURCE_READ, SourceType.UPLOAD.value, "Read uploaded notes"),
        (
            ConsentPurpose.CALENDAR_WRITE,
            None,
            "Write study blocks to the demo calendar after approval",
        ),
        (ConsentPurpose.MONITORING, None, "Recheck authorised sources on a schedule"),
        (ConsentPurpose.EVALUATION, None, "Record optional evaluation metrics"),
    ]
    for purpose, source, note in purposes:
        session.add(
            ConsentGrant(
                id=new_id("cns"),
                user_id=user.id,
                purpose=purpose.value,
                source_type=source,
                granted=True,
                granted_at=now,
                expires_at=now + timedelta(days=30),
                scope_note=note,
            )
        )
    session.add(
        StudentPreference(
            id=new_id("prf"),
            user_id=user.id,
            weekly_study_limit_hours=settings.weekly_study_limit_hours,
            max_study_block_minutes=settings.max_study_block_minutes,
            break_minutes=settings.break_minutes,
            sleep_start="23:00",
            sleep_end="07:00",
            preferred_windows_json=[
                {"days": "weekdays", "start": "09:00", "end": "12:00"},
                {"days": "weekdays", "start": "19:00", "end": "22:00"},
            ],
            commute_minutes=30,
            historical_estimate_factor=1.0,
            monitoring_enabled=True,
            updated_at=now,
        )
    )
    connections = [
        ("src_lms", SourceType.LMS, "Northbridge LMS (synthetic)"),
        ("src_email", SourceType.EMAIL, "Forwarded student mail (synthetic)"),
        ("src_cal", SourceType.CALENDAR, "Student ICS calendar (synthetic)"),
        ("src_upload", SourceType.UPLOAD, "Local uploads"),
    ]
    for cid, stype, label in connections:
        session.add(
            SourceConnection(
                id=cid,
                user_id=user.id,
                source_type=stype.value,
                label=label,
                health="healthy",
                permission_state="granted",
                last_success_at=now,
                stale_after_minutes=180,
                created_at=now,
            )
        )
    from app.services.workspace import seed_optional_connectors

    await seed_optional_connectors(session, user.id)
    from app.services.mailbox import seed_mailbox

    await seed_mailbox(session, user.id)
    ics = IcsConnector()
    observations = await ics.fetch_observations(user.id)
    for obs in observations:
        for event in obs.payload.get("events", []):
            session.add(
                CalendarEvent(
                    id=new_id("cal"),
                    user_id=user.id,
                    uid=str(event["uid"]),
                    title=str(event["title"]),
                    start_at=datetime.fromisoformat(event["start_at"]),
                    end_at=datetime.fromisoformat(event["end_at"]),
                    kind=_event_kind(str(event["title"])),
                    source="ics",
                    written_by_termpilot=False,
                    created_at=now,
                )
            )
    await session.flush()
    return {
        "user_id": user.id,
        "display_name": user.display_name,
        "connections": [c[0] for c in connections],
        "fixed_events": len(observations[0].payload.get("events", [])) if observations else 0,
    }


def _event_kind(title: str) -> str:
    lowered = title.lower()
    if "work" in lowered:
        return "work"
    if "society" in lowered:
        return "society"
    return "fixed"


async def get_user(session: AsyncSession, user_id: str | None = None) -> UserProfile:
    settings = get_settings()
    uid = user_id or settings.demo_user_id
    result = await session.execute(select(UserProfile).where(UserProfile.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise LookupError("demo_user_missing")
    return user
