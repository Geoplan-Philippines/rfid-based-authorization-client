import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { loginGuard } from './core/auth/login.guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './modules/dashboard/dashboard';
import { Auth } from './modules/auth/auth';
import { Reports } from './modules/reports/reports';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    component: Auth,
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Dashboard }
    ]
  },
  {
    path: 'reports',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Reports }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
