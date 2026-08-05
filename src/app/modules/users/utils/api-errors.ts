/**
 * Normalizes the backend error envelope (§3, §7).
 *
 * `message` is a `string[]` for DTO validation failures (400) and a `string` for
 * everything else, so every consumer must handle both. Validation strings are
 * field-prefixed (`"email must be an email"`), which lets us attach them to the
 * control that caused them instead of dumping a list into a toast.
 */

import { HttpErrorResponse } from '@angular/common/http';

/** Form controls the backend can name in a validation message. */
const FIELD_NAMES = ['firstName', 'lastName', 'email', 'password', 'role'] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export type FieldErrors = Partial<Record<FieldName, string>>;

function isFieldName(value: string): value is FieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

/** The `string | string[]` normalizer the contract calls for. */
export function toMessages(message: unknown): string[] {
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string');
  if (typeof message === 'string') return [message];
  return [];
}

/** Pulls `message` out of an `HttpErrorResponse` body, in either shape. */
export function apiMessages(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) return [];
  const body = error.error;
  if (!body || typeof body !== 'object') return [];
  return toMessages((body as { message?: unknown }).message);
}

/**
 * Groups 400 validation strings onto the fields that caused them. A field with
 * several messages (omitting `password` returns both a length and a type error)
 * keeps the first — the most actionable one.
 */
export function fieldErrorsFrom(error: unknown): FieldErrors {
  const errors: FieldErrors = {};
  for (const message of apiMessages(error)) {
    const token = message.split(' ')[0];
    if (isFieldName(token) && !errors[token]) errors[token] = message;
  }
  return errors;
}

/** Validation messages that belong to no field (e.g. `property x should not exist`). */
export function generalMessages(error: unknown): string[] {
  return apiMessages(error).filter(message => !isFieldName(message.split(' ')[0]));
}

export function statusOf(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}
