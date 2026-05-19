import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './modules/dashboard/dashboard';
import { Auth } from './modules/auth/auth';
import { Reports } from './modules/reports/reports';
import { Home } from './modules/home/home';

export const routes: Routes = [
  {
    path: 'auth',
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
  {
    path: 'home',
    component: Home,
  }

];
