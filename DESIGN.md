---
name: Eagle Cement Gate Authorization
description: A refined, restrained admin console for RFID gate access — a trustworthy ledger of every pass-through.
colors:
  ledger-blue: "#0B4EA2"
  ledger-blue-hover: "#03285A"
  ledger-blue-active: "#01183C"
  signal-cyan: "#22D3EE"
  cyan-ink: "#083344"
  page-bg: "#F8FBFF"
  ink: "#0B161F"
  slate-body: "#365261"
  muted-slate: "#55707F"
  pale-blue: "#E8F1FF"
  border: "#DBE5F0"
  verified-green: "#3DBE81"
  verified-green-muted: "#D1EDE0"
  alert-red: "#C2261B"
  alert-red-muted: "#FFE1DE"
typography:
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Work Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Work Sans, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sharp: "0"
  base: "2px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.base}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.ledger-blue-hover}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.slate-body}"
    rounded: "{rounded.base}"
  input-text:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0.5rem 0.75rem"
  table-header:
    backgroundColor: "{colors.ledger-blue}"
    textColor: "#FFFFFF"
  nav-item-active:
    backgroundColor: "{colors.pale-blue}"
    textColor: "{colors.ledger-blue}"
  status-chip:
    rounded: "{rounded.base}"
    padding: "0.125rem 0.5rem"
  avatar:
    backgroundColor: "{colors.pale-blue}"
    textColor: "{colors.ledger-blue}"
    rounded: "{rounded.base}"
  dialog-surface:
    backgroundColor: "{colors.page-bg}"
    rounded: "{rounded.base}"
    width: "32rem"
---

# Design System: Eagle Cement Gate Authorization

## 1. Overview

**Creative North Star: "The Gate Ledger"**

This is the interface of an authoritative, auditable register. Every truck that touches the gate becomes a row in the record — a result, a timeline, a set of snapshots. The system's job is to make that record legible and trustworthy: an IT admin scanning for the one anomaly in a hundred clean pass-throughs, or confirming an unknown-tag event against the captured evidence. The visual language serves that act of reading and verifying, never competing with it.

The palette is anchored by a single deep ledger blue (`#0B4EA2`) on a near-white page (`#F8FBFF`). Blue carries structure — table headers, primary actions, the active spine of the navigation — while the body stays calm and quiet. Color beyond that is reserved almost entirely for *state*: a verified green, an alert red, an amber mismatch. The feel is **refined and restrained**: PrimeNG components used straight, tight spacing, flat surfaces defined by hairline borders rather than shadow. Headings in Poppins give quiet authority; Work Sans carries the dense body and labels; a monospace face is reserved strictly for machine codes (EPC / tag IDs).

This system explicitly rejects three things named in PRODUCT.md. It is **not** consumer-SaaS: no gradient text, no glassmorphism, no glossy purple, no hero-metric template. It is **not** legacy gov/ERP: density serves the task, it is never an excuse for tiny fonts or grey clutter. It is **not** a dark "security HUD": authority comes from clarity and order, not neon-on-black drama. And it is never playful — no mascots, candy colors, or emoji in a physical-security tool.

**Key Characteristics:**
- One deep-blue spine on a near-white page; color spent on state, not decoration.
- Near-sharp corners (2px) and square avatars — a crisp, drafting-table feel.
- Flat surfaces, hairline borders; shadow reserved for overlays.
- PrimeNG-first components, one vocabulary across every screen.
- Monospace strictly for machine codes; human text never mono.
- Restrained, state-only motion (reduced-motion-first).

## 2. Colors

A near-white blue-tinted canvas under a single deep-blue structural anchor, with a small, disciplined set of semantic state colors.

### Primary
- **Ledger Blue** (`#0B4EA2`): The structural spine. Carries table headers (deep-blue bar, white text), primary action buttons, the active navigation indicator, and links. Drawn from the PrimeNG Nora primary ramp at step 800.
- **Ledger Blue Hover** (`#03285A`): Hover/pressed state for primary actions (ramp 900). **Ledger Blue Active** (`#01183C`, ramp 950) is the active/pressed deepening.

### Secondary
- **Signal Cyan** (`#22D3EE`): The focus ring (`--ring`) and high-attention accent. Rare by design — it marks the currently-focused control, not decoration. **Cyan Ink** (`#083344`) is its accessible foreground when cyan is ever used as a fill.
- **Pale Blue** (`#E8F1FF`): The soft secondary tint for selected/active backgrounds (the active nav row reads as a ~10% primary wash over white) and quiet informational panels (e.g. the login security notice).

### Tertiary (semantic state)
- **Verified Green** (`#3DBE81`) / **muted** (`#D1EDE0`): Success — verified pass-throughs, active RFID tags.
- **Alert Red** (`#C2261B`, `--destructive`) / **muted** (`#FFE1DE`): Danger — denied, unknown-tag, blocked, error, and destructive emphasis (plate mismatch, failed steps, anomaly counts). AA-safe as text on white (5.85:1) and on the muted bg (4.76:1); white-on-it is 5.85:1. (The old bright `#FF4B4B` failed AA at 3.30:1 and was retired.)
- **Amber (PrimeNG `warn`)**: Caution — face/plate mismatch, lost tags, "no driver". Supplied by the PrimeNG `p-tag` `warn` severity rather than a custom token.

### Neutral
- **Page Background** (`#F8FBFF`): The canvas — a near-white with the faintest blue tint, so the blue chrome reads as part of one family.
- **Ink** (`#0B161F`): Headings and high-emphasis text (`--text-heading` / `--foreground`).
- **Slate Body** (`#365261`, `--text-body`): Body text at full strength (8.3:1).
- **Muted Slate** (`#55707F`, `--text-muted` / `text-muted`): Secondary text and field/stat labels. Use this for muted text instead of low-opacity body (`text-body/50`), which falls to ~2.6:1 on a near-white page. Muted Slate holds 5.2:1 — **never mute text by lowering opacity below the 4.5:1 floor for elegance.**
- **Border** (`#DBE5F0`): Hairline borders, dividers, input strokes (`--border` / `--input`).

### Named Rules
**The Deep-Blue Spine Rule.** Exactly one blue (`#0B4EA2`) anchors structure — headers, primary actions, active nav. The page body stays near-white. Do not introduce a second brand hue.

**The Status-Carries-Meaning Rule.** Color beyond the blue spine is spent on *state* only: green/red/amber via `p-tag` severities and primary-action emphasis. If a color isn't communicating a status or a primary action, it shouldn't be there.

## 3. Typography

**Display Font:** Poppins (with `sans-serif` fallback) — auto-applied to `h1`–`h6` at weight 600.
**Body Font:** Work Sans (with `sans-serif` fallback) — applied to `body`, `button`, `input`, `textarea`, `select`.
**Label/Mono Font:** a system monospace stack (`ui-monospace, SFMono-Regular, Menlo`), reserved for machine codes.

**Character:** A geometric display sans (Poppins) paired with a humanist workhorse sans (Work Sans) — a real contrast axis, not two near-identical sans-serifs. Poppins lends headings quiet, even-weighted authority; Work Sans stays legible at small sizes in dense tables and forms.

### Hierarchy
- **Headline** (Poppins 700, 1.5rem / `text-2xl`, line-height 1.2): Page titles ("Trucks", "Transactions"). Login uses a one-step-larger 1.875rem.
- **Title** (Poppins 600, 1.25rem / `text-xl`): App brand mark in the header, dialog/card titles.
- **Body** (Work Sans 400, 0.875rem / `text-sm`): The default. Table cells, descriptions, form values. Cap prose at 65–75ch; tables may run denser.
- **Label** (Work Sans 600, 0.6875rem / 11px, letter-spacing 0.12em, uppercase): Navigation section headers ("OPERATIONS", "REGISTRY") and small status badges. The only place small-caps tracking is sanctioned.
- **Mono** (monospace, 0.875rem): EPC IDs, RFID tag codes, event codes — anything that is a machine identifier.

### Named Rules
**The Mono-for-Machine Rule.** Monospace is reserved exclusively for machine codes (EPC/tag/event IDs). Human-readable text — names, models, labels, prose — is never set in mono.

## 4. Elevation

The system is **flat by default**. Depth is conveyed by hairline borders (`#DBE5F0`) and tonal layering — a bordered header (`border-b`), a bordered sidebar (`border-r`), bordered inputs and tables — not by resting shadows. Shadow appears only to lift a surface *off* the page: modal dialogs and the login card. Tables, panels, and registry rows sit flat on the canvas.

### Shadow Vocabulary
- **Overlay lift** (PrimeNG dialog default `box-shadow`): Modals and the login card (`shadow-lg`). Signals "this floats above the page and is temporarily modal."

### Named Rules
**The Flat-Ledger Rule.** Surfaces are flat at rest. A shadow is permission to float — used only for overlays (dialogs, the auth card). If a card has a resting shadow for decoration, remove it; reach for a `1px` border instead.

## 5. Components

Refined and restrained: PrimeNG components used straight, with Tailwind utilities for layout and spacing. The same control looks the same on every screen.

### Buttons
- **Shape:** Near-sharp (2px, `--radius`); large surfaces may go fully sharp (0). Set globally via the PrimeNG preset's `primitive.borderRadius`, so PrimeNG controls and Tailwind surfaces match.
- **Primary:** `p-button` filled in Ledger Blue, white text (e.g. "New" with a `pi-plus` leading icon). Padding ≈ `0.5rem 1rem`.
- **Hover / Focus:** Background deepens to `#03285A` (hover) / `#01183C` (active); focus shows the cyan ring. Loading via `[loading]` (inline spinner, label retained).
- **Secondary / Ghost / Outlined:** `severity="secondary" [text]="true"` for icon-only chrome buttons (header bell/settings/sign-out, mobile hamburger) and dialog "Cancel"; `[outlined]="true" severity="secondary"` for toggles ("Show archived").

### Chips (Status Tags) — signature component
- **Style:** PrimeNG `p-tag`, near-sharp (2px), label + severity color. This is the system's core status vocabulary.
- **Severity mapping (canonical, do not improvise):** `success` = Verified / Active (green); `danger` = Denied / Unknown Tag / Blocked / Error (red); `warn` = Face Mismatch / Plate Mismatch / Lost / "no driver" (amber); `info` = Manual Override / Primary role (blue); `secondary` = Inactive / Relief (grey); `contrast` = Retired (dark).
- Pair color with the text label — never rely on color alone (supports color-blind users and the anomalies-first goal).

### Cards / Containers
- **Corner Style:** Near-sharp (2px, `rounded-sm`) for panels, sections, photo thumbnails, and inline alerts. No `rounded-lg`/`rounded-xl` (8–12px) on surfaces.
- **Background:** Page background or white.
- **Shadow Strategy:** Flat by default (see Elevation). The login card is the deliberate exception (`shadow-lg`).
- **Border:** Hairline `#DBE5F0`.
- **Internal Padding:** `lg` (24px) for page mains; `md` (16px) for panels.

### Avatars
- **Shape:** Square (`p-avatar shape="square"`), never circle. Near-sharp corners follow the system radius (2px).
- **Fill:** Initials or photo on a `primary-100` ground with `primary-800` text — the same treatment for trucks, drivers, users, and assignment lists.
- Photos (`<img>` thumbnails) are likewise square (`rounded-sm`), not circular.

### Inputs / Fields
- **Style:** `pInputText`, `p-password` (toggle mask), and `p-iconfield` + `p-inputicon` for search (leading `pi-search`). White fill, hairline border, near-sharp (2px) radius. Labels in Work Sans `font-medium text-sm`.
- **Focus:** Cyan ring (`--ring`, `#22D3EE`).
- **Error:** `ng-invalid ng-dirty` border treatment plus a `text-destructive` `<small>` message below the field. **Disabled** uses reduced opacity.

### Navigation
- **Sidebar:** Sectioned (Operations / Compliance / Registry / Admin). Section headers are uppercase tracked Labels at `text-body/60`. Items are icon + label rows.
  - **Active:** `bg-primary/10`, Ledger-Blue text, `font-medium`, with a 2px blue left-edge indicator (`border-l-2 border-primary`). Sets `aria-current="page"`.
  - **Inactive:** Slate text, hover `bg-foreground/5`.
  - **Coming-soon:** Dimmed (`text-body/40`), `aria-disabled`, with a pill "Soon" badge.
  - **Mobile:** Off-canvas drawer (`w-64`), translucent backdrop, slide-in transition 200ms `ease-in-out`.
- **Header:** Fixed top bar (`h-16`), bordered bottom. Brand mark left; icon chrome buttons + avatar + sign-out right; hamburger below `md`.

### Tables (Registry / Transactions)
- **Header:** Distinctive deep-blue bar — `bg-primary` cells with white text. The one place the spine blue fills a full surface.
- **Density:** Cells run `0.5rem 0.75rem` (8/12px) — tighter than Nora's default 12px vertical so long registries stay scannable. Set once via the preset's `datatable` tokens (`headerCell`/`bodyCell`/`footerCell`).
- **Rows:** Clickable, hover `bg-foreground/5`; a trailing chevron action button (`rounded-sm`). Machine IDs in mono.
- **Empty state:** Centered icon + message in `primary-200` — teaches what belongs here, not a bare "nothing found".
- **Loading:** `p-progressSpinner` (overlays/full-area), not inline spinners scattered through content.
- **Pagination:** `p-paginator` with `rowsPerPageOptions` [10, 25, 50].

### Dialogs (CRUD pattern)
- `p-dialog`, modal, `width: 32rem`, responsive breakpoint `640px → 92vw`, `dismissableMask`. Body is a reactive form (`flex flex-col gap-4`); footer is "Cancel" (text secondary) + "Save" (primary, `pi-check`, `[loading]`). This is the standard create/edit affordance — prefer it over inventing inline editors, but don't reach for a modal when an inline/progressive flow would serve.

### Detail / record dialogs (truck, driver, RFID tag)
Read-mostly record views, wider (`46–60rem`, two-column). Hierarchy and grouping carry the screen — not borders around every fragment:
- **Facts as a definition list** (`<dl>`): sentence-case `text-muted` label above a `text-heading` value. No uppercase-tracked labels (tracking is for nav/badges only). Don't repeat the identity already in the dialog header.
- **Related rows in one divided container:** a single `rounded-sm border border-border divide-y divide-border` list — not a stack of individually-bordered boxes, which reads as scattered fragments.
- **Section rhythm:** headers `text-sm font-semibold text-heading` (+ muted count), separated by generous space or a hairline `border-t`.
- **Anomaly cue:** denial counts render `text-destructive` + semibold when `> 0`, plain `text-heading` otherwise — surfacing the exception (anomalies-first).
- **Empty states:** a centered `border-dashed` muted note, consistent across sections.

### Alerts / inline errors
- **Inline error banner:** `border border-destructive/30 bg-muted-destructive text-destructive`, leading `pi-exclamation-triangle`, `role="alert"` (AA-safe, 4.76:1).
- **Field errors:** a `text-destructive` `<small>` under the field — never `text-red-500` (fails AA at 3.76:1).

### Named Rules
**The PrimeNG-First Rule.** Reach for the PrimeNG component before building a custom control. Style with Tailwind utilities and theme tokens; keep overrides minimal. One component vocabulary, screen to screen.

**The Near-Sharp Rule.** Corners are near-sharp: 2px (`--radius` / `rounded-sm`) on controls and surfaces, 0 for full-bleed structural surfaces. Never `rounded-lg`/`rounded-xl`/`rounded-2xl` (8px+). The base is set once in the PrimeNG preset so components and Tailwind surfaces agree. Genuinely circular *indicators* (status dots, timeline nodes, spinners) stay round — the rule governs corner radius, not intentionally-circular shapes.

**The Square-Avatar Rule.** Avatars and photo thumbnails are square (near-sharp), never circles or pills.

## 6. Do's and Don'ts

### Do:
- **Do** anchor structure with the single Ledger Blue (`#0B4EA2`) and keep the page near-white (`#F8FBFF`).
- **Do** spend color on state: use the canonical `p-tag` severity mapping for every status, and pair color with a text label.
- **Do** set machine codes (EPC / tag / event IDs) in monospace; keep human text in Work Sans.
- **Do** keep surfaces flat with `1px` `#DBE5F0` borders; reserve shadow for overlays.
- **Do** keep corners near-sharp (2px / `rounded-sm`); use square avatars (`shape="square"`).
- **Do** reach for a PrimeNG component first; keep one vocabulary across screens.
- **Do** keep motion restrained and state-only, with a `prefers-reduced-motion: reduce` fallback.
- **Do** keep body text at or above 4.5:1 contrast — bump slate toward ink rather than fading it for "elegance".
- **Do** use `--text-muted` (`text-muted`, `#55707F`) for secondary/field labels — never low-opacity body text like `text-body/50` (≈2.6:1, fails AA).
- **Do** present record facts as a definition list and consolidate related rows into one `divide-y` container.

### Don't:
- **Don't** use consumer-SaaS clichés: no gradient text, no glassmorphism, no glossy purple, no big-number hero-metric template.
- **Don't** drift to legacy gov/ERP clutter — tiny fonts and grey density for its own sake. Density must serve the task.
- **Don't** build a dark "security HUD": no neon-on-black, no sci-fi terminal drama.
- **Don't** add playful/startup-cute touches — no mascots, candy colors, or emoji.
- **Don't** use `border-left`/`border-right` greater than 1px as a decorative colored stripe on cards, callouts, or alerts (the sidebar's 2px active indicator is the one sanctioned, functional exception — do not generalize it).
- **Don't** introduce a second brand hue or a new font family; the system is two fonts and one blue spine.
- **Don't** use `rounded-lg`/`rounded-xl` (8–12px) on surfaces, or circle/pill avatars — corners stay near-sharp, avatars stay square.
- **Don't** use uppercase-tracked labels outside nav section headers and badges — they make record views feel scattered.
- **Don't** stack individually-bordered rows; consolidate into a single `divide-y` container.
- **Don't** use the retired bright `#FF4B4B` or `text-red-500` for text — use `--destructive` (`#C2261B`), which is AA-safe.
- **Don't** convey pass/fail/anomaly by color alone.
