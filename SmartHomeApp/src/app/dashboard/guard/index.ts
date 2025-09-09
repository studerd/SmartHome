import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AppNode} from '@shared';
import {SecurityService} from '../../guest/service';

export function DashboardGuard(redirectRoute: string = AppNode.REDIRECT_TO_PUBLIC): CanActivateFn {
  return () => {
    const security: SecurityService = inject(SecurityService);
    const canAccess: boolean = security.isAuthenticated$();
    const router: Router = inject(Router);// Nous faisons une DI pour récupérer le système de Router
    return canAccess || router.createUrlTree([redirectRoute]);
  };
}
