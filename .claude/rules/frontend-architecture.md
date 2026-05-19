# Frontend Architecture & UI Standards

## Project Context

This repository is an Angular frontend application built using:

* Angular v21+
* PrimeNG
* Tailwind CSS
* TypeScript
* Signals-based state management

The application should prioritize:

* maintainability
* scalability
* accessibility
* responsive design
* clean UI consistency
* reusable components
* minimal custom styling

---

# UI Stack Requirements

## Styling

* Use Tailwind CSS as the primary styling solution.
* Prefer utility-first styling over custom CSS files.
* Avoid plain CSS unless absolutely necessary.
* Avoid inline `<style>` blocks.
* Avoid large component-specific SCSS/CSS files.
* Prefer Tailwind utilities for spacing, layout, typography, responsiveness, and states.
* Use PrimeNG theming and Tailwind together consistently.

## PrimeNG

* Prefer PrimeNG components over building custom UI components from scratch.
* Reuse PrimeNG components whenever possible.
* Follow PrimeNG design patterns and APIs consistently.
* Do not recreate existing PrimeNG functionality manually.
* Use PrimeFlex utilities only if Tailwind cannot achieve the same result cleanly.
* Keep PrimeNG styling overrides minimal.

## Component Design

* Keep components small and focused.
* Prefer standalone components.
* Use signals and computed values for local state.
* Use `ChangeDetectionStrategy.OnPush`.
* Avoid deeply nested component trees when unnecessary.
* Prefer composition over large monolithic components.

## Templates

* Use Angular native control flow:
  * `@if`
  * `@for`
  * `@switch`
* Keep template logic simple.
* Avoid complex inline expressions.
* Avoid duplicated markup.

## Forms

* Prefer Reactive Forms.
* Use strongly typed forms.
* Centralize validation logic when possible.
* Reuse form field components for consistency.

## Layout

* Use Tailwind responsive utilities.
* Design mobile-first.
* Maintain consistent spacing and sizing scales.
* Prefer flex/grid utilities over custom layout CSS.

## Accessibility

* All UI must pass WCAG AA minimum standards.
* Ensure keyboard navigation support.
* Ensure proper ARIA labels and semantic HTML.
* Ensure proper focus states.
* Maintain sufficient color contrast.

## Performance

* Lazy load feature routes.
* Avoid unnecessary re-renders.
* Use signals/computed efficiently.
* Optimize large lists and tables.
* Avoid unnecessary custom directives or abstractions.

## Code Quality

* Use strict TypeScript typing.
* Avoid `any`.
* Prefer reusable utilities and shared UI patterns.
* Keep business logic outside templates.
* Keep styling consistent across the application.

## Preferred Approach

Priority order when building UI:

1. PrimeNG component
2. Tailwind utility classes
3. Angular built-in features
4. Minimal custom CSS only when necessary

Avoid overengineering solutions.
Favor readability and consistency over clever abstractions.
