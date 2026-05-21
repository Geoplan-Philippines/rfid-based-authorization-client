import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./modules/auth/auth').then((m) => m.Auth),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/dashboard/dashboard').then((m) => m.Dashboard),
      },
    ],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/reports/reports').then((m) => m.Reports),
      },
    ],
  },
  {
    path: 'home',
    loadComponent: () => import('./modules/home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: 'auth' },
];
