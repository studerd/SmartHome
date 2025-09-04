import {Routes} from '@angular/router';
import {AppNode} from '@shared';
import {App} from '@root';

export const accountRoutes: Routes = [
  {
    path: '',
    redirectTo:'detail/5',
    pathMatch: 'full'
  },
  {
    path: AppNode.LIST,
    loadComponent: () => import('./page').then(p => p.AccountListPage)

  },
  {
    path: `${AppNode.DETAIL}:id`,
    loadComponent: () => import('./page').then(p => p.AccountDetailPage)

  }
]
