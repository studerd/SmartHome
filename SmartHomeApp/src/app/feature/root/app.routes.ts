import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@guest').then(a => a.guestRoutes)
  }
];
