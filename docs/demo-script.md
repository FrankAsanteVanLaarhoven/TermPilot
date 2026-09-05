# Demo script

Frozen clock: **Saturday 5 Sep 2026 08:00 Europe/London**.

Student: synthetic **A. Rivera** (`usr_demo_a7f3`).

## Presenter checklist

1. `make install`
2. Start API: `cd backend && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
3. Start UI: `cd frontend && npm install && npm run dev`
4. Open http://127.0.0.1:3000 at 1440×900
5. Confirm mode DEMO, grok `fake` or `live`
6. Reset from Settings if the tower is not empty

## 2-minute-40-second version

0:00 Chaos — Sources show LMS, mail and ICS; timeline is only fixed events.
0:20 Command — paste:

> TermPilot, reconcile my academic and recruiting commitments for the next 14 days. Show conflicts, build a realistic plan around my 20-hour weekly limit, and ask before changing my calendar.

0:40 Coordination — Agent Operations shows Scout, Verifier, Planner, Guardian.
1:00 Discovery — six obligations; lab report merged; problem set conflicted; reading needs review.
1:20 Evidence — open the conflict; both claims visible; injection ignored in the ledger.
1:40 Judgment — TermPilot refuses to pick a deadline.
2:00 Plan — study blocks appear around classes, work and sleep.
2:15 Control — Approval Centre shows the exact calendar diff; calendar count unchanged.
2:30 Execution — Approve, then Apply. Rollback remains available.
2:40 Proof — Evidence ledger and Impact demo metrics (not a pilot).

## 30-second version

Run the command, open Conflicts, show the unsent clarification, open Approvals, show that Apply is blocked until Approve.

## Backup offline mode

If the network or xAI is down, `GROK_MODE=fake` still completes the frozen demo. If the UI fails, run the same path against http://127.0.0.1:8000/docs.

## Backup recording

Record the 2:40 path once after `make demo-smoke` passes.
