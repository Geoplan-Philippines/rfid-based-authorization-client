/** Frontend mirror of the backend audit-logs contract (context/audit-logs). */

import { PaginationMeta } from '../../../core/types/api-response.types';

/**
 * Action and entityType are open strings on the backend (e.g. `UPDATE_TRUCK`,
 * `UPLOAD_DRIVER_PHOTO`). The display layer humanizes any value, so new actions
 * render gracefully without a hardcoded enum.
 */
export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  /** Polymorphic per action — e.g. `{ fields: [...] }` or `{ photoUrl: '...' }`. */
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogListResult {
  data: AuditLog[];
  meta: PaginationMeta;
}
