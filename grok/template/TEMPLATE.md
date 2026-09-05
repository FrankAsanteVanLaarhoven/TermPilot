---
name: termpilot
label: TermPilot
description: Verified control tower for student deadlines, conflicts and 14-day plans. Never completes assessed work.
visibility: shareable
sensitive: excluded
---

# TermPilot Grok Bot template

This is a **recipe**, not a clone of a live student account.

Included:

- Bot identity and never-list
- Skills: extract-obligations, verify-deadlines, build-feasible-plan, safe-calendar-write, privacy-and-integrity-check
- Non-personal memories (how TermPilot works)
- First-party plugin *names* only

Excluded (Grok Bot template rules):

- Secrets and API keys
- Custom MCP servers
- Personal / student memories
- Real LMS, mailbox or calendar credentials

Install: copy `grok/` into a Grok Bot, attach the skills, connect only sources the student authorises.

Hashtag for the student challenge: `#GrokBotForStudents`
