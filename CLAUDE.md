# Claude Code Project Instructions

## Required Project Rules

Before making changes, read and follow:

- `.claude/rules/angular-best-practices.md`

## Skills

Project-specific skills are located in:

- `.claude/skills`

Use the relevant skill when the task matches the skill description.

## Design Context

Strategic design intent lives in `PRODUCT.md` (register, users, purpose, brand
personality, anti-references, design principles). Read it before any UI work.

- Register: **product** (internal security-ops admin; design serves the task).
- Users: IT/registry admins (daily, dense screens) + a single mobile guard page (acts only on unknown tags — verified RFID auto-opens the boom).
- Auth model: RFID is the sole gate. Face/plate are alert-only (email IT on mismatch), never gate access.
- Personality: **calm authority** — precise, authoritative, quiet. Anomalies-first.
- Avoid: consumer-SaaS gradients, legacy gov/ERP clutter, dark "security HUD".
- Identity: deep blue `#0B4EA2` + cyan `#22D3EE`, Poppins/Work Sans, Nora-based PrimeNG preset. Preserve it.

A visual `DESIGN.md` is not yet generated; run `/impeccable document` to capture tokens/components when needed.
