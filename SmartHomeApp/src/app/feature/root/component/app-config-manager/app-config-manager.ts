import {Component, computed, EventEmitter, inject, Output, Signal, signal, WritableSignal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {AccountDetailDataManager} from '../../../account/component';
import {BiometricData, BiometricDataUtil, FaceRecognitionManager, LocalFaceDbService} from '@shared';
import {AccountDataPayload} from '../../../account/data';
import {AccountService} from '../../../account/service';
import {isEmpty} from 'lodash';

@Component({
  selector: 'app-app-config-manager',
  imports: [
    TranslatePipe,
    AccountDetailDataManager,
    FaceRecognitionManager
  ],
  templateUrl: './app-config-manager.html',
  standalone: true,
  styleUrl: './app-config-manager.scss'
})
export class AppConfigManager {
  @Output() saveData: EventEmitter<AccountDataPayload> = new EventEmitter<AccountDataPayload>();
  accountData$: WritableSignal<AccountDataPayload> = signal({
    username: '',
    password: '',
    mail: '',
    biometricData: BiometricDataUtil.makeBiometricData([])
  });
  accountDataIsValid$: Signal<boolean> = computed(() => this.setAccountDataValid(this.accountData$()));
  private readonly accountService: AccountService = inject(AccountService);
  private readonly localDatabaseService: LocalFaceDbService = inject(LocalFaceDbService);

  setBiometricData(biometricData: BiometricData) {
    this.accountData$.set({...this.accountData$(), biometricData})
  }

  setAccountData(data: AccountDataPayload): void {
    this.accountData$.set({...data, biometricData: this.accountData$().biometricData});

  }

  save(): void {
    if (this.accountDataIsValid$()) {
      this.saveData.emit(this.accountData$());
    }
  }

  public setAccountDataValid(accountData: AccountDataPayload): boolean {

    return !isEmpty(accountData.username) &&
      accountData.biometricData.vector.length > 0 &&
      !isEmpty(accountData.mail) &&
      !isEmpty(accountData.password);
  }
}
