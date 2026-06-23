# Product

## Register

product

## Users

Two distinct user groups, very different contexts:

- **IT / registry admins (primary, daily).** Power users at a desk. They manage the registry (drivers, trucks, RFID tags, user accounts), review gate transactions, inspect anomaly snapshots/timelines, and watch the dashboard summary. They live in dense tables, filters, and CRUD dialogs. They receive email alerts when a gate event is denied / face-mismatch / plate-mismatch / unknown-tag, then come into the app to investigate.
- **Boom-barrier guard (single dedicated page, mobile).** Standing at the gate, on a phone. The guard only acts on the exception: when a tag is unknown/unverified the system does **not** auto-open, so the vehicle routes to the guard, who decides whether to manually trigger the boom. High-consequence, low-frequency action. Needs an unmistakable, confirmable control and clear current state — mobile-first, not the admin's dense surface. The guard signs in with their own limited-access credentials (a restricted role: gate actions only, none of the admin/registry surface).

## Product Purpose

Eagle Cement gate-authorization system. Controls physical vehicle access at the plant. **The RFID tag is the sole authorization gate:**

- **Verified tag → barrier opens automatically.** No human in the loop.
- **Unknown / unverified tag → routes to the guard,** who decides whether to manually open the boom.
- **Plate (ANPR) and face recognition do NOT gate access.** They run alongside as a monitoring layer; a face/plate mismatch only emails IT to investigate — it never blocks or opens the barrier.

Every pass-through is recorded as a transaction with a result (`VERIFIED`, `UNKNOWN_TAG`, `FACE_MISMATCH`, `PLATE_MISMATCH`, `MANUAL_OVERRIDE`, `DENIED`, `ERROR`), a verification breakdown, a step timeline, and CCTV snapshots (face / plate / wide).

Success = anomalies are caught and resolved fast. The system pushes email alerts on suspect events (unknown tag, face/plate mismatch); the app is where admins triage them, confirm against snapshots, and keep the registry accurate so automatic RFID verification keeps working. The guard's mobile page is where an unknown-tag vehicle is manually resolved. Adjacent surfaces (live gate monitoring, CCTV feeds, audit logs, compliance reports) are planned but currently "coming soon."

## Brand Personality

Calm authority. Precise, dense, unflashy — the confidence of a well-run control room, not the gloss of a marketing dashboard. Voice is plain and exact: states named for what they are, no hype, no exclamation. The interface should read as trustworthy instrumentation for a security system. Three words: **precise, authoritative, quiet.**

## Anti-references

- **Consumer SaaS gradients.** No gradient text, glassmorphism, glossy purple, or hero-metric template. This is not a growth dashboard.
- **Legacy gov / ERP.** No cluttered grey tables, tiny fonts, or 2005-era admin density-for-its-own-sake. Density serves the task; it is not an excuse for noise.
- **Dark security HUD.** No neon-on-black "cyber" surveillance theater, sci-fi terminal vibes, or fake-urgency styling. Authority comes from clarity, not drama.
- (Implied) No playful / startup-cute mascots, candy colors, or emoji — wrong register for physical-security software.

## Design Principles

- **Anomalies first.** The daily job is catching denied/mismatch/unknown-tag events fast. Surface the exception over the routine; the dashboard summary and transaction list should make a suspect event the thing your eye lands on. Color and weight are spent on state, not decoration.
- **Trust through precision.** Security-critical data must be unambiguous. Snapshots, plate/face match results, and timelines are evidence — present them as instruments, exact and legible, never as styled content.
- **The tool disappears.** Admins are power users in flow. Use earned-familiar, consistent affordances (standard tables, filters, CRUD dialogs, one component vocabulary screen to screen). Surprise is a cost, not a feature.
- **Weight the one critical action.** The guard's manual boom trigger is rare and consequential. That single screen breaks from admin density: large, confirmable, with unmistakable current state — distinct from everywhere else.
- **Calm under load.** Restraint is the brand. Muted surface, reserved color, no motion theater. Confidence is communicated by order and clarity, not by intensity.

## Accessibility & Inclusion

- WCAG AA minimum across the app; must pass AXE (per project rules).
- **Reduced-motion first.** Motion is minimal and conveys state only; `prefers-reduced-motion: reduce` is respected strictly, with crossfade/instant fallbacks. No orchestrated load sequences.
- State (pass / fail / anomaly) should not rely on color alone where feasible — pair with icon and/or text label, which also serves the anomaly-first goal.
