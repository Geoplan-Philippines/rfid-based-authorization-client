import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { AppPreset } from './app.preset';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
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
