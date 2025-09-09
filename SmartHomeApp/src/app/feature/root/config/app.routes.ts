import {Routes} from '@angular/router';
import {AppNode} from '@shared';
import {DashboardGuard} from '../../../dashboard/guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: AppNode.PUBLIC,
    pathMatch: 'full'
  },
  {
    path: AppNode.PUBLIC,
    loadChildren: () => import('@guest').then(r => r.guestRoutes)
  },
  {
    path: AppNode.DASHBOARD,
    canActivate: [DashboardGuard()],
    loadChildren: () => import('../../../dashboard/dashboard.route').then(p => p.dashboardRoutes)
  }
];
