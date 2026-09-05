"""Runtime configuration. Secrets are read from the environment only."""

from __future__ import annotations

from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
FIXTURES_ROOT = REPO_ROOT / "fixtures"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["demo", "test", "production"] = Field(default="demo", alias="TERMPILOT_ENV")
    host: str = Field(default="127.0.0.1", alias="TERMPILOT_HOST")
    port: int = Field(default=8000, alias="TERMPILOT_PORT")
    frontend_origin: str = Field(default="http://127.0.0.1:3000", alias="TERMPILOT_FRONTEND_ORIGIN")
    timezone: str = Field(default="Europe/London", alias="TERMPILOT_TIMEZONE")
    now_override: str | None = Field(default="2026-09-05T08:00:00+01:00", alias="TERMPILOT_NOW")
    demo_user_id: str = Field(default="FAVL", alias="TERMPILOT_DEMO_USER_ID")

    database_url: str = Field(default="sqlite+aiosqlite:///./termpilot.db", alias="DATABASE_URL")

    xai_api_key: str | None = Field(default=None, alias="XAI_API_KEY")
    xai_base_url: str = Field(default="https://api.x.ai/v1", alias="XAI_BASE_URL")
    xai_model: str = Field(default="grok-4.5", alias="XAI_MODEL")
    grok_mode: Literal["auto", "fake", "live"] = Field(default="auto", alias="GROK_MODE")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")

    plan_horizon_days: int = Field(default=14, alias="PLAN_HORIZON_DAYS")
    max_study_block_minutes: int = Field(default=120, alias="MAX_STUDY_BLOCK_MINUTES")
    break_minutes: int = Field(default=15, alias="BREAK_MINUTES")
    safety_buffer_hours: int = Field(default=24, alias="SAFETY_BUFFER_HOURS")
    weekly_study_limit_hours: int = Field(default=20, alias="WEEKLY_STUDY_LIMIT_HOURS")

    raw_source_retention_hours: int = Field(default=72, alias="RAW_SOURCE_RETENTION_HOURS")
    approval_ttl_minutes: int = Field(default=30, alias="APPROVAL_TTL_MINUTES")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_json: bool = Field(default=True, alias="LOG_JSON")
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    sentry_traces_sample_rate: float = Field(default=0.0, alias="SENTRY_TRACES_SAMPLE_RATE")

    simulate_lms_outage: bool = Field(default=False, alias="SIMULATE_LMS_OUTAGE")
    simulate_grok_timeout: bool = Field(default=False, alias="SIMULATE_GROK_TIMEOUT")
    simulate_calendar_write_failure: bool = Field(
        default=False, alias="SIMULATE_CALENDAR_WRITE_FAILURE"
    )
    simulate_offline: bool = Field(default=False, alias="SIMULATE_OFFLINE")

    fixtures_dir: Path | None = Field(default=None, alias="FIXTURES_ROOT")

    linkedin_client_id: str | None = Field(default=None, alias="LINKEDIN_CLIENT_ID")
    linkedin_client_secret: str | None = Field(default=None, alias="LINKEDIN_CLIENT_SECRET")
    orcid_client_id: str | None = Field(default=None, alias="ORCID_CLIENT_ID")
    orcid_client_secret: str | None = Field(default=None, alias="ORCID_CLIENT_SECRET")
    x_client_id: str | None = Field(default=None, alias="X_CLIENT_ID")
    x_client_secret: str | None = Field(default=None, alias="X_CLIENT_SECRET")
    notion_client_id: str | None = Field(default=None, alias="NOTION_CLIENT_ID")
    notion_client_secret: str | None = Field(default=None, alias="NOTION_CLIENT_SECRET")
    slack_client_id: str | None = Field(default=None, alias="SLACK_CLIENT_ID")
    slack_client_secret: str | None = Field(default=None, alias="SLACK_CLIENT_SECRET")
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    microsoft_client_id: str | None = Field(default=None, alias="MICROSOFT_CLIENT_ID")
    microsoft_client_secret: str | None = Field(default=None, alias="MICROSOFT_CLIENT_SECRET")
    canvas_client_id: str | None = Field(default=None, alias="CANVAS_CLIENT_ID")
    canvas_client_secret: str | None = Field(default=None, alias="CANVAS_CLIENT_SECRET")

    @property
    def fixtures_root(self) -> Path:
        if self.fixtures_dir is not None:
            return Path(self.fixtures_dir)
        return FIXTURES_ROOT

    @field_validator(
        "xai_api_key",
        "openrouter_api_key",
        "linkedin_client_id",
        "linkedin_client_secret",
        "orcid_client_id",
        "orcid_client_secret",
        "x_client_id",
        "x_client_secret",
        "notion_client_id",
        "notion_client_secret",
        "slack_client_id",
        "slack_client_secret",
        "google_client_id",
        "google_client_secret",
        "microsoft_client_id",
        "microsoft_client_secret",
        "canvas_client_id",
        "canvas_client_secret",
        mode="before",
    )
    @classmethod
    def empty_key_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)

    @property
    def frozen_now(self) -> datetime | None:
        if not self.now_override:
            return None
        return datetime.fromisoformat(self.now_override)

    @property
    def use_live_grok(self) -> bool:
        if self.grok_mode == "fake":
            return False
        if self.grok_mode == "live":
            return True
        return bool(self.xai_api_key)

    @property
    def grok_connection_state(self) -> str:
        if self.simulate_offline:
            return "offline"
        if self.use_live_grok:
            return "live"
        return "fake"

    @property
    def cors_origins(self) -> list[str]:
        return [
            self.frontend_origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
