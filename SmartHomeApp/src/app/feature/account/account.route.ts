import {Routes} from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./page').then(p => p.AccountListPage)
  },
]
