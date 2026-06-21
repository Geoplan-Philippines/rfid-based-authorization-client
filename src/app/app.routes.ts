import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { loginGuard } from './core/auth/login.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'transactions', pathMatch: 'full' },
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
    path: 'transactions',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/transactions/transactions').then(m => m.Transactions) },
      { path: ':id', loadComponent: () => import('./modules/transactions/pages/transaction-detail/transaction-detail').then(m => m.TransactionDetail) }
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
  {
    path: 'rfid-tags',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./modules/rfid-tags/rfid-tags').then(m => m.RfidTags) }
    ]
  },
  { path: '**', redirectTo: 'transactions' }
];
