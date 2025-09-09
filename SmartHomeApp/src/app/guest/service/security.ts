import {computed, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {EMPTY, from, Observable, of, switchMap, tap} from 'rxjs';
import {ApiCodeResponse, ApiResponse, ApiService, ApiURI, TokenService} from '@api';
import {SignInPayload} from '../data/payload';
import {LocalFaceDbService, LocalFaceUser} from '@shared';
import {isNil} from 'lodash';
import {Router} from '@angular/router';
import {ToastService} from '../../shared/core/service/toast.service';
import {Account, AccountUtil} from '@guest';

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

  signIn(payload: SignInPayload): Observable<ApiResponse> {
    return this.getLocalAccount(payload).pipe(
      tap((result) => console.log('localUser', result)),
      switchMap((localUser: LocalFaceUser | null) =>
        !isNil(localUser) ? this.api.post(ApiURI.SIGN_IN, {...payload, username: localUser.username}) : of({
          result: false,
          data: null,
          code: ApiCodeResponse.NO_LOCAL_USER,
          paramError: false
        }))
    )
  }

  private getLocalAccount(payload: SignInPayload): Observable<LocalFaceUser | null> {
    return this.localFaceDbService.identify(payload.biometricData);
  }
}
