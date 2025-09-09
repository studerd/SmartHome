import {ApiResponse, ApiService, ApiURI} from '@api';
import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {EMPTY, map, Observable, of, switchMap, tap} from 'rxjs';
import {AppData} from './data';
import {AccountDataPayload} from '../account/data';
import {CreateConfigPayload} from './data/payload';
import {Account} from '@guest';
import {BiometricDataUtil, LocalFaceDbService} from '@shared';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private readonly api: ApiService = inject(ApiService);
  public config$: WritableSignal<AppData> = signal({app_id: '', isInitialized: false});
  private readonly localDatabaseService: LocalFaceDbService = inject(LocalFaceDbService);

  constructor() {
    this.getConfig().subscribe();
  }

  createConfig(data: AccountDataPayload): Observable<any> {
    const payload: CreateConfigPayload = {
      id: this.config$().app_id,
      superAdminData: data
    }
    return this.api.post(ApiURI.CREATE_CONFIG, payload).pipe(
      switchMap((response: ApiResponse) =>
        response.result ? this.getConfig() : of(this.config$())),
      switchMap((config: AppData) =>
        config.isInitialized ?
          this.localDatabaseService.addOrUpdate(config.superAdmin!.username,
            BiometricDataUtil.makeBiometricData(config.superAdmin!.biometricData!))
          : of(EMPTY)
      ))

  }

  private getConfig(): Observable<AppData> {
    return this.api.get(ApiURI.APP_CONFIG).pipe(
      tap((response: ApiResponse) => this.config$.set(response.data)),
      map(() => this.config$())
    )
  }
}
