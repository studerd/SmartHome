import {Routes} from '@angular/router';
import {AppNode} from '@shared';

export const homePlanRoute: Routes = [

  {
    path: '',
    loadComponent: () => import('./router')
      .then(p => p.HomePlanRouter),
    children: [
      {
        path: '',
        loadComponent: () => import('./page').then(r => r.HomePlanHomePage)
      }
    ]
  }];
