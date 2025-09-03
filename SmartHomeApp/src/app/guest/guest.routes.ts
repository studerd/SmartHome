import {Routes} from '@angular/router';

export const guestRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full'
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./page').then(p => p.SignInPage)
      }
    ]
  }
];
