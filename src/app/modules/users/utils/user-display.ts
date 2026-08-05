/** Display vocabulary for accounts: role chips, status chips, payload diffing. */

import { DisplayTag } from '../../../shared/ui/status-tags';
import { Role, User } from '../../../core/types/user.types';
import { UpdateUserPayload } from '../types/user.types';

const ROLE_TAGS: Record<Role, DisplayTag> = {
  // Color is spent on state and privilege, not on decoration: the one thing worth
  // spotting in a user list is who holds full control. The other two roles stay quiet.
  SUPER_ADMIN: { label: 'Super Admin', severity: 'info' },
  ADMIN: { label: 'Admin', severity: 'secondary' },
  OPERATOR: { label: 'Operator', severity: 'secondary' },
};

export function userRoleTag(role: Role): DisplayTag {
  return ROLE_TAGS[role] ?? { label: role, severity: 'secondary' };
}

export function roleLabel(role: Role): string {
  return userRoleTag(role).label;
}

/** Archive is a soft delete — "Archived", never "Deleted" (§8). */
export function accountStatusTag(isArchived: boolean): DisplayTag {
  return isArchived
    ? { label: 'Archived', severity: 'secondary' }
    : { label: 'Active', severity: 'success' };
}

/** The shape the edit form holds; `password` is blank unless an admin is resetting it. */
export interface UserFormValue {
  firstName: string;
  lastName: string;
  email: string;
  /** `null` when editing a super admin, whose role has no assignable value here. */
  role: Role | null;
  password: string;
}

/**
 * Builds a `PATCH` body from only what changed (§8).
 *
 * This is not cosmetic. Sending an unchanged `role` on a `SUPER_ADMIN` target is a
 * 403, and sending an unchanged `role` on yourself is a different 403 — diffing makes
 * both edge cases disappear. An empty result means "nothing to save": skip the request,
 * because `{}` is a 400.
 */
export function buildUpdatePayload(form: UserFormValue, original: User): UpdateUserPayload {
  const payload: UpdateUserPayload = {};

  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const email = form.email.trim().toLowerCase();

  if (firstName !== (original.firstName ?? '')) payload.firstName = firstName;
  if (lastName !== (original.lastName ?? '')) payload.lastName = lastName;
  if (email !== original.email) payload.email = email;
  // A null role means "left untouched" — never send it, and never re-send an
  // unchanged one (an unchanged `SUPER_ADMIN` is still a 403).
  if (form.role && form.role !== original.role) payload.role = form.role;
  // Only when the reset field was actually filled — never send a blank password.
  if (form.password) payload.password = form.password;

  return payload;
}

export function isEmptyPayload(payload: UpdateUserPayload): boolean {
  return Object.keys(payload).length === 0;
}
