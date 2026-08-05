import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { AppPreset } from './app.preset';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Re-read the account from /auth/me before the first route resolves, so role
    // gating never runs on a stale localStorage session. Never rejects.
    provideAppInitializer(() => inject(AuthService).verifySession()),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      theme: {
        preset: AppPreset,
        options: {
          darkModeSelector: false
        }
      },
    })
  ]
};
