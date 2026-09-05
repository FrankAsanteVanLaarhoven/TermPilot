# TermPilot

**The verified control tower for student life.**

> No important deadline should become a surprise.

TermPilot inspects authorised student sources, extracts obligations with provenance, refuses to guess material conflicts, builds a feasible 14-day plan with OR-Tools, and waits for explicit approval before writing a **demo** calendar.

It organises work. It will not complete assessed homework or impersonate a student.

## Screenshot placeholders

Capture after `make demo-smoke` at 1440×900:

- `docs/screenshots/control-tower.png`
- `docs/screenshots/conflict.png`
- `docs/screenshots/plan-board.png`
- `docs/screenshots/approval.png`

## Architecture summary

Grok interprets messy text. Deterministic code owns dates, consent, conflicts and schedules. See [docs/architecture.md](docs/architecture.md).

## Why Grok Bot is essential

Specialist bots (Scout, Verifier, Planner, Guardian) keep interpretation bounded. The Orchestrator cannot bypass Guardian or Verifier. Skills encode the contracts. A monitoring routine rechecks sources and alerts only on material change.

Grok CLI has no hosted bot runtime; TermPilot implements the bots in-process and ships CLI skills in `.grok/`. See [docs/grok-bot-setup.md](docs/grok-bot-setup.md).

## Quick start

```bash
cd termpilot
make install
# terminal 1
make backend
# terminal 2
make frontend
```

Open http://127.0.0.1:3000

Docker: `docker compose up --build`

## Environment variables

Copy `.env.example` to `.env`. `XAI_API_KEY` is optional. Never commit it.

## Demo reset and seed

```bash
curl -X POST http://127.0.0.1:8000/demo/reset
```

Frozen clock: `2026-09-05T08:00:00+01:00`.

## Test commands

```bash
make test
make lint
make typecheck
make demo-smoke
```

## Privacy model

Consent-scoped reads, pseudonymous IDs, redacted logs, demo calendar only. [docs/privacy-and-safety.md](docs/privacy-and-safety.md)

## Limitations

- Synthetic LMS / mail / ICS only
- Single demo user
- Live Grok optional
- No institutional analytics

## Known failures

See [docs/failure-modes.md](docs/failure-modes.md)

## Roadmap

Governed real connectors, optional staff views with aggregation safeguards, mobile-native approvals.

## Competition pitch

[docs/competition-submission.md](docs/competition-submission.md)
