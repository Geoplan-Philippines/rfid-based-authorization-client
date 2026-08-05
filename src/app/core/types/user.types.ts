/**
 * The canonical account shape. `GET /auth/me` and every `/users` endpoint return
 * this exact object, so one type serves the whole app (docs/frontend-users-api.md §5).
 *
 * Lives in `core` rather than the users module because `core/auth` needs it too and
 * must not depend on a feature module.
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR';

/** Every role, in privilege order. Assignable on create; see `EDITABLE_ROLES` for edit. */
export const ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'];

/** `password` is never included in a response. */
export interface User {
  id: string;
  /** Nullable — never interpolate raw; use `displayName`. */
  firstName: string | null;
  /** Nullable — never interpolate raw; use `displayName`. */
  lastName: string | null;
  /** Always lowercase, unique across active *and* archived accounts. */
  email: string;
  role: Role;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A user with a name may still have one half null, so falls back to the email. */
export function displayName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}

/** Avatar initials from whichever name parts exist, else the first email character. */
export function userInitials(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const first = user.firstName?.trim()?.[0] ?? '';
  const last = user.lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}
