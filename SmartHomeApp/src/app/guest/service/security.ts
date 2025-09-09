import {inject, Injectable} from '@angular/core';
import {EMPTY, from, Observable, of, switchMap, tap} from 'rxjs';
import {ApiCodeResponse, ApiResponse, ApiService, ApiURI} from '@api';
import {SignInPayload} from '../data/payload';
import {LocalFaceDbService, LocalFaceUser} from '@shared';
import {isNil} from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
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
