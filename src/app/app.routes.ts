import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { loginGuard } from './core/auth/login.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/auth').then(m => m.Auth),
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/dashboard/dashboard').then(m => m.Dashboard) }
    ]
  },
  {
    path: 'reports',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/reports/reports').then(m => m.Reports) }
    ]
  },
  {
    path: 'users',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/users/users').then(m => m.Users) }
    ]
  },
  {
    path: 'drivers',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/drivers/drivers').then(m => m.Drivers) }
    ]
  },
  {
    path: 'trucks',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/trucks/trucks').then(m => m.Trucks) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
