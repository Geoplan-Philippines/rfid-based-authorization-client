import { environment } from '../../../environments/environment';

/**
 * Resolve a registry photo URL. The backend persists relative paths (e.g.
 * `uploads/trucks/<id>.jpg`); absolute URLs are returned untouched.
 */
export function resolvePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${environment.fileBaseUrl}/${path.replace(/^\/+/, '')}`;
}
