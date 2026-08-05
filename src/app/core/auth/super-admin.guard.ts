import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Every `/users` endpoint is `SUPER_ADMIN`-only — there is no read-only tier, so an
 * `ADMIN` or `OPERATOR` reaching this route would see a screen of 403s (§2).
 * Signed-out visitors go to login; signed-in ones without the role go to the dashboard.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  return authService.isSuperAdmin() ? true : router.createUrlTree(['/dashboard']);
};
