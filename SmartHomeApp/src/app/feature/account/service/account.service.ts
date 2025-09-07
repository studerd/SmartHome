import {inject, Injectable} from '@angular/core';
import {ApiResponse, ApiService, ApiURI} from '@api';
import {AccountDataPayload} from '../data';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private api: ApiService = inject(ApiService);

  public sendModification(accountDataPayload: AccountDataPayload): Observable<ApiResponse> {
    return this.api.post(ApiURI.ACCOUNT_SEND_MODIFICATION, accountDataPayload);
  }
}
