import {Routes} from '@angular/router';
import {AppNode} from '@shared';

export const dashboardRoutes: Routes = [

  {
    path: '',
    loadComponent: () => import('./router')
      .then(p => p.DashboardRouter),
    children: [
      {
        path: '',
        redirectTo: AppNode.ACCOUNT,
        pathMatch: 'full'
      },
      {
        path: AppNode.ACCOUNT,
        loadChildren: () => import('../feature/account/account.route').then(r => r.accountRoutes)
      }
    ]
  }];
