import {computed, effect, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {ApiCodeResponse, ApiResponse, ApiService, ApiURI, Token, TokenService} from '@api';
import {SignInPayload} from '../data/payload';
import {AppNode, LocalFaceDbService, LocalFaceUser} from '@shared';
import {isNil} from 'lodash';
import {Router} from '@angular/router';
import {ToastService} from '../../shared/core/service/toast.service';
import {Account, AccountUtil} from '@guest';
import {ToastType} from '@core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly tokenService: TokenService = inject(TokenService);
  public account$: WritableSignal<Account> = signal(AccountUtil.getEmpty());
  public isAuthenticated$: Signal<boolean> = computed(() => !this.account$().isEmpty);
  private readonly router: Router = inject(Router);

  private readonly toastService: ToastService = inject(ToastService);
  private readonly api: ApiService = inject(ApiService);
  private readonly localFaceDbService: LocalFaceDbService = inject(LocalFaceDbService);
  constructor() {
    effect(() => this.handleAuthenticatedChange(this.tokenService.token$()));
  }
  signIn(payload: SignInPayload): Observable<ApiResponse> {
    return this.getLocalAccount(payload).pipe(
      tap((result) => console.log('localUser', result)),
      switchMap((localUser: LocalFaceUser | null) =>
        !isNil(localUser) ?
          this.api.post(ApiURI.SIGN_IN, {...payload, username: localUser.username}).pipe(
            tap(response => this.handleLogin(response))
          ) :
          of({
          result: false,
          data: null,
          code: ApiCodeResponse.NO_LOCAL_USER,
          paramError: false
        }))
    )
  }
  public logOut(): void {
    this.tokenService.logOut();
  }
  private getLocalAccount(payload: SignInPayload): Observable<LocalFaceUser | null> {
    return this.localFaceDbService.identify(payload.biometricData);
  }
  private handleLogin(response: ApiResponse): void {
    if (response.result) {
      this.tokenService.setToken({...response.data, isEmpty: false});
    } else {
      this.toastService.addToast(ToastType.ERROR, response.code, 8000, []);
    }
  }
  private me(): void {
    this.api.get(ApiURI.ME)
      .pipe(tap((response: ApiResponse) => {
        if (response.result) {
          this.account$.set(AccountUtil.fromDto(response.data));
          //http://localhost:4200/landing/01HGR2MZ0WE5QS7P8W14ARP6QR
          if (!window.location.pathname.startsWith('/' + AppNode.REDIRECT_TO_AUTHENTICATED) && !window.location.pathname.startsWith('/landing')) {
            this.router.navigate([AppNode.REDIRECT_TO_AUTHENTICATED]).then();
          }
        } else {
          this.router.navigate([AppNode.REDIRECT_TO_PUBLIC]).then();
        }
      }))
      .subscribe();
  }
  private handleAuthenticatedChange(token: Token): void {
    if (!token.isEmpty) {
      this.me();
    } else {
      this.account$.set(AccountUtil.getEmpty());
      this.router.navigate([AppNode.REDIRECT_TO_PUBLIC]).then();
    }
  }
}
