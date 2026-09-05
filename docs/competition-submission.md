# Competition submission draft

**One-sentence problem.** Students miss colliding deadlines because LMS, email and calendar never agree.

**User story.** A. Rivera asks TermPilot to reconcile the next 14 days, expose conflicts, build a feasible plan under a 20-hour cap, and wait before touching the calendar.

**Innovation.** Evidence-backed obligations plus a real constraint solver, not a chatbot to-do list.

**Grok-native features.** Specialist bots, skills (`extract-obligations`, `verify-deadlines`, `build-feasible-plan`, `safe-calendar-write`, `privacy-and-integrity-check`), a monitoring routine, and optional live xAI function-calling with a documented fake adapter.

**Technical implementation.** FastAPI, SQLAlchemy, OR-Tools CP-SAT, Next.js command centre, SQLite demo.

**Privacy and safety.** Consent, redaction, no homework completion, demo calendar only.

**Measured evidence.** System tests and five-run demo-smoke. Pilot evidence: none collected.

**Limitations.** No real LMS OAuth, no real mailbox, no real Google Calendar, single demo user.

**Institutional pathway.** Later, add governed connectors, aggregation with ethics review, and staff views that students opt into. Not in this MVP.
