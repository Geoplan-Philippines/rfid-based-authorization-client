import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './modules/dashboard/dashboard';
import { Auth } from './modules/auth/auth';
import { Reports } from './modules/reports/reports';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: Auth
  },
  {
    path: 'dashboard',
    component: MainLayout,
    children: [
      { path: '', component: Dashboard }
    ]
  },
  {
    path: 'reports',
    component: MainLayout,
    children: [
      { path: '', component: Reports }
    ]
  },
];
