import {Routes} from '@angular/router';
import {AppNode} from '@shared';
import {DashboardGuard} from '../../dashboard/guard';

export const routes: Routes = [

  {
    path: '',
    loadChildren: () => import('@guest').then(a => a.guestRoutes)
  },
  {
    path: AppNode.DASHBOARD,
    canActivate: [DashboardGuard()],
    loadChildren: () => import('../../dashboard/dashboard.route').then(p => p.dashboardRoutes)
  }
];
