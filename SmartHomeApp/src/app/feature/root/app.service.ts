import {ApiResponse, ApiService, ApiURI} from '@api';
import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {Observable, of, switchMap, tap} from 'rxjs';
import {AppData} from './data/model/app-data.model';
import {AccountDataPayload} from '../account/data';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private readonly api: ApiService = inject(ApiService);
  public config$: WritableSignal<AppData> = signal({app_id: '', isInitialized: false});

  constructor() {
    this.getConfig().subscribe();
  }

  createConfig(data: AccountDataPayload): Observable<ApiResponse> {
    return this.api.post(ApiURI.CREATE_CONFIG, data).pipe(
      switchMap((response: ApiResponse) =>
        response.result ? this.getConfig() : of(response))
    )

  }

  private getConfig(): Observable<ApiResponse> {
    return this.api.get(ApiURI.APP_CONFIG).pipe(
      tap((response: ApiResponse) => this.config$.set(response.data))
    )
  }
}
