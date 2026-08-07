/** Frontend mirror of the users contract (docs/frontend-users-api.md §5, §6, §11). */

import { PaginationMeta } from '../../../core/types/api-response.types';
import { Role, User } from '../../../core/types/user.types';

export { ROLES, displayName, userInitials } from '../../../core/types/user.types';
export type { Role, User } from '../../../core/types/user.types';

/**
 * Roles offered by the **edit** form. `SUPER_ADMIN` is absent by design: `PATCH`
 * rejects it with 403 even when the target already holds it (§8). A super admin is
 * created only via `POST /users`.
 */
export const EDITABLE_ROLES: readonly Role[] = ['ADMIN', 'OPERATOR'];

/** Omitting `role` on create yields `ADMIN` — mirrored as the form default (§6.1). */
export const DEFAULT_CREATE_ROLE: Role = 'ADMIN';

/** The backend's hard ceiling on `limit`; a larger value is a 400 (§6.2). */
export const MAX_PAGE_SIZE = 50;

export interface CreateUserPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: Role;
}

/**
 * Every field optional, but at least one must be present. Build it from *changed*
 * fields only — `forbidNonWhitelisted` rejects unknown properties, and sending an
 * unchanged `role` on a super admin is a 403 (§7, §8).
 */
export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface ListUsersParams {
  page: number;
  /** Clamped to `MAX_PAGE_SIZE` by the service. */
  limit: number;
  search?: string;
  role?: Role;
  includeArchived?: boolean;
}

export interface UserListResult {
  data: User[];
  meta: PaginationMeta;
}
