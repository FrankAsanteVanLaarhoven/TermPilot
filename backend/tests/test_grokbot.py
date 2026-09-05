from __future__ import annotations

from app.services.grokbot import catalog, classify_tool
from app.services.voicebridge import classify_intent
from httpx import AsyncClient


def test_catalog_is_grok_bot_not_a_second_bot() -> None:
    pack = catalog()
    assert pack["engine"] == "grok_bot"
    assert pack["writes_without_approval"] is False
    assert pack["spoken_yes_writes"] is False
    ids = {row["id"] for row in pack["tools"]}
    assert {
        "open_tower",
        "open_workspace",
        "connect_all",
        "organise_notes",
        "run_workflow",
        "weather",
        "world_clock",
        "open_help",
    } <= ids
    assert all(row["writes"] is False for row in pack["tools"])


def test_classify_does_not_steal_existing_intents() -> None:
    assert classify_intent("write my essay") == "blocked"
    assert classify_intent("yes") == "spoken_confirm"
    assert classify_intent("open calendar") == "open_calendar"
    assert classify_intent("check email") == "email"
    assert classify_intent("show the newsfeed") == "open_news"
    assert classify_intent("student union") == "open_news"
    assert classify_intent("clean my inbox") == "mailbox_cleanup"
    assert classify_intent("What do I need to finish this week?") == "week"


def test_classify_maps_student_tools() -> None:
    assert classify_tool("open my workspace") == "open_workspace"
    assert classify_intent("open my workspace") == "open_workspace"
    assert classify_intent("connect all my accounts") == "connect_all"
    assert classify_intent("show the weather") == "weather"
    assert classify_intent("world clock") == "world_clock"
    assert classify_intent("open help") == "open_help"
    assert classify_intent("run standup") == "run_workflow"


async def test_tools_endpoint(client: AsyncClient) -> None:
    body = (await client.get("/grokbot/tools")).json()
    assert body["engine"] == "grok_bot"
    assert "Grok Bot" in body["claim"]
    assert body["tools"]


async def test_connect_all_via_grok_bot_does_not_write_calendar(client: AsyncClient) -> None:
    await client.post("/demo/reset")
    before = await client.get("/calendar")
    response = await client.post(
        "/voicebridge/turn",
        json={"text": "connect all my accounts", "language": "en"},
    )
    after = await client.get("/calendar")
    body = response.json()
    assert body["intent"] == "connect_all"
    assert body["facts"]["open_view"] == "sources"
    assert body["facts"]["one_click"] is True
    assert len(before.json()["items"]) == len(after.json()["items"])


async def test_spoken_yes_still_cannot_write(client: AsyncClient) -> None:
    await client.post("/demo/reset")
    body = (
        await client.post(
            "/voicebridge/turn",
            json={"text": "yes", "source": "voice", "transcript_confidence": 0.99},
        )
    ).json()
    assert body["intent"] == "spoken_confirm"
    assert body["facts"]["action"] == "none"
