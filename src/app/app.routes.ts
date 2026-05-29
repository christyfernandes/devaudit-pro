import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'DevAudit Pro — Frontend Best Practices',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In — DevAudit Pro',
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/audit/new-audit/new-audit.component').then(m => m.NewAuditComponent),
        title: 'New Audit — DevAudit Pro',
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./features/audit/results/results.component').then(m => m.ResultsComponent),
        title: 'Audit Results — DevAudit Pro',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
