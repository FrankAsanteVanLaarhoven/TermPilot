"""Grok Bot is TermPilot's student-facing engine.

It does not train a second bot. Every student feature is a named tool
Grok Bot can open or execute through existing services. Guardian, Verifier
and on-screen approvals are never bypassed. Spoken yes is never a write.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.policies.consent import ConsentError

# Student-facing tools Grok Bot can operate. Proof-only agent ops stay out.
STUDENT_TOOLS: list[dict[str, Any]] = [
    {
        "id": "open_tower",
        "label": "My week",
        "view": "tower",
        "kind": "open",
        "writes": False,
        "phrases": ("open tower", "control tower", "show my week", "open my week", "my week"),
    },
    {
        "id": "open_workspace",
        "label": "Workspace",
        "view": "workspace",
        "kind": "open",
        "writes": False,
        "phrases": ("open workspace", "my workspace", "show workspace", "show notes"),
    },
    {
        "id": "organise_notes",
        "label": "Organise notes",
        "view": "workspace",
        "kind": "execute",
        "writes": False,
        "phrases": ("organise notes", "organize notes", "file my notes", "organise my notes"),
    },
    {
        "id": "open_connectors",
        "label": "Connected services",
        "view": "sources",
        "kind": "open",
        "writes": False,
        "phrases": ("open connectors", "connected services", "show connectors", "link accounts"),
    },
    {
        "id": "connect_all",
        "label": "Connect all",
        "view": "sources",
        "kind": "execute",
        "writes": False,
        "phrases": ("connect all", "connect my accounts", "connect everything"),
    },
    {
        "id": "open_workflows",
        "label": "Automations",
        "view": "workflows",
        "kind": "open",
        "writes": False,
        "phrases": ("open workflows", "show automations", "automations", "show workflows"),
    },
    {
        "id": "run_workflow",
        "label": "Run a workflow",
        "view": "workflows",
        "kind": "execute",
        "writes": False,
        "phrases": (
            "run standup",
            "slack standup",
            "run workflow",
            "clarify deadline",
            "recruiting brief",
        ),
    },
    {
        "id": "open_obligations",
        "label": "Deadlines and tasks",
        "view": "obligations",
        "kind": "open",
        "writes": False,
        "phrases": ("open obligations", "show obligations", "my tasks", "show tasks"),
    },
    {
        "id": "open_timeline",
        "label": "Schedule",
        "view": "timeline",
        "kind": "open",
        "writes": False,
        "phrases": ("open timeline", "show timeline", "my schedule", "show schedule"),
    },
    {
        "id": "open_evidence",
        "label": "Why TermPilot says this",
        "view": "evidence",
        "kind": "open",
        "writes": False,
        "phrases": ("open evidence", "show evidence", "why do you say", "provenance"),
    },
    {
        "id": "open_impact",
        "label": "My progress",
        "view": "impact",
        "kind": "open",
        "writes": False,
        "phrases": ("open impact", "my progress", "show impact"),
    },
    {
        "id": "open_settings",
        "label": "Preferences",
        "view": "settings",
        "kind": "open",
        "writes": False,
        "phrases": ("open settings", "preferences", "show settings"),
    },
    {
        "id": "open_help",
        "label": "Help",
        "view": "help",
        "kind": "open",
        "writes": False,
        "phrases": ("open help", "how does this work", "show help"),
    },
    {
        "id": "open_chat",
        "label": "Chat",
        "view": "chat",
        "kind": "open",
        "writes": False,
        "phrases": ("open chat", "back to chat"),
    },
    {
        "id": "weather",
        "label": "7-day forecast",
        "view": "tower",
        "kind": "execute",
        "writes": False,
        "phrases": ("weather", "forecast", "will it rain"),
    },
    {
        "id": "world_clock",
        "label": "World clock",
        "view": "tower",
        "kind": "execute",
        "writes": False,
        "phrases": ("world clock", "what time is it", "time zones"),
    },
]


def catalog() -> dict[str, Any]:
    return {
        "engine": "grok_bot",
        "product": "TermPilot",
        "claim": (
            "Grok Bot operates every student-facing TermPilot tool. "
            "No second bot is trained. Guardian, Verifier and on-screen approvals stay in force."
        ),
        "writes_without_approval": False,
        "spoken_yes_writes": False,
        "tools": [
            {
                "id": row["id"],
                "label": row["label"],
                "view": row["view"],
                "kind": row["kind"],
                "writes": row["writes"],
            }
            for row in STUDENT_TOOLS
        ],
        "also_via_voicebridge": [
            "reconcile",
            "week",
            "conflict",
            "reschedule",
            "open_calendar",
            "open_conflicts",
            "open_approvals",
            "open_news",
            "mailbox",
            "mailbox_cleanup",
            "mailbox_alerts",
            "mailbox_draft",
            "support",
            "switch_language",
        ],
    }


def classify_tool(lowered: str) -> str | None:
    ranked: list[tuple[int, str, str]] = []
    for row in STUDENT_TOOLS:
        for phrase in row["phrases"]:
            if phrase in lowered:
                ranked.append((len(phrase), phrase, row["id"]))
    if not ranked:
        return None
    ranked.sort(key=lambda item: item[0], reverse=True)
    return ranked[0][2]


def _workflow_name(text: str) -> str:
    lowered = text.lower()
    if "note" in lowered or "notion" in lowered:
        return "organise-notes"
    if "standup" in lowered or "slack" in lowered:
        return "slack-standup"
    if "recruit" in lowered:
        return "recruiting-brief"
    return "clarify-deadline"


async def execute_tool(
    session: AsyncSession,
    user_id: str,
    intent: str,
    text: str,
) -> tuple[str, dict[str, Any], bool]:
    """Run a Grok Bot tool through existing services. Never writes calendars or mail."""
    tool = next((row for row in STUDENT_TOOLS if row["id"] == intent), None)
    if tool is None:
        return ("I do not have that tool.", {"action": "none"}, False)

    facts: dict[str, Any] = {"open_view": tool["view"], "engine": "grok_bot", "tool": intent}
    requires_screen = True

    if intent == "connect_all":
        from app.services.workspace import connect_all

        result = await connect_all(session, user_id)
        facts.update(result)
        spoken = (
            f"Connected {result.get('count', 0)} services Grok Bot can already use. "
            "Opening connected services. Calendar and mail still wait for on-screen approval."
        )
        return spoken, facts, True

    if intent == "organise_notes":
        from app.services.workspace import organise_notes

        try:
            result = await organise_notes(session, user_id)
        except ConsentError as exc:
            return (
                "Connect Notion first so I can file notes you already own. "
                f"({exc.code}) I will not invent notes.",
                {**facts, "open_view": "sources", "action": "none"},
                True,
            )
        facts.update(result)
        spoken = (
            f"Filed {result.get('organised', 0)} notes. "
            "Assessed work was tagged as reference only — I did not complete it."
        )
        return spoken, facts, True

    if intent == "run_workflow":
        from app.services.workspace import run_workflow

        name = _workflow_name(text)
        try:
            result = await run_workflow(session, user_id, name)
        except (ConsentError, LookupError) as exc:
            code = getattr(exc, "code", type(exc).__name__)
            return (
                f"I could not run {name} ({code}). Opening automations. "
                "Nothing was sent.",
                {**facts, "action": "none", "workflow": name},
                True,
            )
        facts.update(result)
        spoken = (
            f"Ran {name} through the existing workflow graph. "
            "If a message was drafted it is unsent until you approve it on screen."
        )
        return spoken, facts, True

    if intent == "weather":
        from app.services.world import weather_week

        try:
            weather = await weather_week()
        except Exception:  # noqa: BLE001
            weather = {"stale": True, "place": "London", "source": "unavailable"}
        facts["weather"] = weather
        days = weather.get("days") or []
        first = days[0] if days else None
        if first:
            spoken = (
                f"London forecast via Open-Meteo: {first.get('label')} "
                f"{first.get('tmax')}° / {first.get('tmin')}°. Opening your week widgets."
            )
        else:
            spoken = "Opening your week so you can see the forecast widget. Live weather was unavailable."
        return spoken, facts, True

    if intent == "world_clock":
        from app.services.world import world_clock

        clock_pack = world_clock()
        facts["world_clock"] = clock_pack
        first = (clock_pack.get("items") or [{}])[0]
        spoken = (
            f"{first.get('label', 'London')} is {first.get('time', '—')}. "
            "Opening your week widgets for the full world clock."
        )
        return spoken, facts, True

    spoken = (
        f"Opening {tool['label']}. Grok Bot is using the TermPilot tool that already exists — "
        "I am not a second trained bot."
    )
    return spoken, facts, requires_screen
