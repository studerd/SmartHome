import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AppNode} from '@shared';

export function DashboardGuard(redirectRoute: string = AppNode.REDIRECT_TO_PUBLIC): CanActivateFn {
  return () => {
    /* const security: AccountService = inject(AccountService);
     const canAccess: boolean = security.isAuthenticated$();*/ // Cette valeur sera calculée par le service plus tard
    const canAccess = true;
    const router: Router = inject(Router);// Nous faisons une DI pour récupérer le système de Router
    return canAccess || router.createUrlTree([redirectRoute]);
  };
}
