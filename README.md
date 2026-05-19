# Frontend Boilerplate

Internal Angular frontend template. Clone at the start of every new frontend project.

## Use cases

Built for:

- internal admin dashboards
- data-heavy CRUD apps
- MVPs / prototypes
- any SPA needing PrimeNG + Tailwind

Not for: marketing sites, SSR-heavy sites, mobile-first PWAs.

## Stack

- Angular 21 (standalone, signals)
- PrimeNG 21 (Nora-based custom preset)
- Tailwind CSS v4
- TypeScript 5.9
- Vitest

## Quick start

```bash
git clone https://github.com/Geoplan-Philippines/frontend-boilerplate <new-project-name>
cd <new-project-name>
rm -rf .git && git init
npm install
npm start
```

Post-clone checklist:

- rename `name` in [package.json](package.json)
- update `apiBaseUrl` in [src/environments/](src/environments/)
- update this README title + description
- update brand colors in [src/app/app.presets.ts](src/app/app.presets.ts) and [src/styles.css](src/styles.css)

## Scripts

- `npm start` — dev server
- `npm run build` — prod build
- `npm run watch` — dev build, watch mode
- `npm test` — Vitest

## Structure

```
src/
  app/
    app.config.ts      # providers, router, PrimeNG theme
    app.routes.ts      # route table (lazy load features here)
    app.presets.ts     # PrimeNG theme preset (brand colors)
  environments/        # dev / prod config
  styles.css           # Tailwind, fonts, CSS tokens
.claude/
  rules/               # required reading for contributors + Claude Code
```

## Design system

**Tokens** — defined as CSS vars in [src/styles.css](src/styles.css), exposed to Tailwind via `@theme`. Examples: `bg-primary`, `text-heading`, `border-border`.

**Fonts** — Poppins (headings, auto-applied to `h1`–`h6`), Work Sans (body, auto-applied to `body`, `button`, `input`, `textarea`, `select`).

**PrimeNG theme** — custom preset extending Nora, defined in [src/app/app.presets.ts](src/app/app.presets.ts). Brand colors live here. Keep hex values in sync with [src/styles.css](src/styles.css).

**Layout** — `.main-container` utility in [src/styles.css](src/styles.css) for page-level max-width wrapper.

## Conventions

Required reading before contributing:

- [.claude/rules/angular-best-practices.md](.claude/rules/angular-best-practices.md)
- [.claude/rules/frontend-architecture.md](.claude/rules/frontend-architecture.md)

Highlights:

- standalone components only, no NgModules
- signals for state, `computed()` for derived state
- `ChangeDetectionStrategy.OnPush` on every component
- native control flow (`@if`, `@for`, `@switch`) — no `*ngIf` / `*ngFor`
- Reactive Forms only
- PrimeNG first, Tailwind second, custom CSS last
- WCAG AA minimum, must pass AXE

## Environments

`apiBaseUrl` and flags live in [src/environments/environment.dev.ts](src/environments/environment.dev.ts) and `environment.prod.ts`. Angular swaps them via `fileReplacements` at build time.

## License

Internal — Geoplan. Not for distribution.
