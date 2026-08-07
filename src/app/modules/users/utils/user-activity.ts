/**
 * Renders the audit trail for one account (§10).
 *
 * `UPDATE_USER` metadata carries field *names* only, never values — which is what
 * lets the timeline say "Password reset" without ever having seen the password.
 */

import { AuditLog } from '../../audit-logs/types/audit-log.types';
import { DisplayTag, TagSeverity } from '../../../shared/ui/status-tags';
import { Role } from '../../../core/types/user.types';
import { roleLabel } from './user-display';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  role: 'Role',
  password: 'Password',
};

export interface ActivityEntry {
  id: string;
  /** Headline verb, e.g. "Account created". */
  title: string;
  /** What changed, when the action carries detail. */
  detail: string | null;
  severity: TagSeverity;
  icon: string;
  actorId: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, Pick<ActivityEntry, 'title' | 'severity' | 'icon'>> = {
  CREATE_USER: { title: 'Account created', severity: 'success', icon: 'pi-user-plus' },
  UPDATE_USER: { title: 'Details updated', severity: 'secondary', icon: 'pi-pencil' },
  ARCHIVE_USER: { title: 'Account archived', severity: 'secondary', icon: 'pi-inbox' },
  UNARCHIVE_USER: { title: 'Account restored', severity: 'success', icon: 'pi-replay' },
};

function describeUpdate(metadata: Record<string, unknown> | null): string | null {
  const fields = metadata?.['fields'];
  if (!Array.isArray(fields) || !fields.length) return null;

  return fields
    .map(String)
    .map(field =>
      // The one field whose change is worth naming as an event, not a diff.
      field === 'password' ? 'Password reset' : `${FIELD_LABELS[field] ?? field} changed`,
    )
    .join(' · ');
}

function describeCreate(metadata: Record<string, unknown> | null): string | null {
  const role = metadata?.['role'];
  return typeof role === 'string' ? `Created as ${roleLabel(role as Role)}` : null;
}

export function toActivityEntry(log: AuditLog): ActivityEntry {
  const meta = ACTION_META[log.action] ?? {
    title: log.action.replace(/_/g, ' ').toLowerCase(),
    severity: 'secondary' as TagSeverity,
    icon: 'pi-circle',
  };

  let detail: string | null = null;
  if (log.action === 'UPDATE_USER') detail = describeUpdate(log.metadata);
  else if (log.action === 'CREATE_USER') detail = describeCreate(log.metadata);

  return {
    id: log.id,
    title: meta.title,
    detail,
    severity: meta.severity,
    icon: meta.icon,
    actorId: log.actorId,
    createdAt: log.createdAt,
  };
}

export function activityTag(entry: ActivityEntry): DisplayTag {
  return { label: entry.title, severity: entry.severity };
}
