import {inject, Injectable} from '@angular/core';
import {ApiResponse, ApiService, ApiURI} from '@api';
import {map, Observable} from 'rxjs';
import {Account, AccountUtil} from '@guest';
import {AccountDataPayload} from '../data';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private api: ApiService = inject(ApiService);

  public sendModification(accountDataPayload: AccountDataPayload): Observable<Account> {
    return this.api.post(ApiURI.ACCOUNT_SEND_MODIFICATION, accountDataPayload)
      .pipe(map((response: ApiResponse) =>
        response.result ? AccountUtil.fromDto(response.data) : AccountUtil.getEmpty()
      ))
  }
}
