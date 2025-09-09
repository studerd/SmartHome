import {Component, inject} from '@angular/core';
import {Account, AccountDataPayload} from '../../data';
import {AccountDetailDataManager} from '../../component';
import {BiometricData, BiometricDataUtil, FaceRecognitionManager, LocalFaceDbService} from '@shared';
import {AccountService} from '../../service';
import {EMPTY, from, of, switchMap} from 'rxjs';

@Component({
  selector: 'app-account-detail-page',
  imports: [
    AccountDetailDataManager,
    FaceRecognitionManager
  ],
  templateUrl: './account-detail-page.html',
  standalone: true,
  styleUrl: './account-detail-page.scss'
})
export class AccountDetailPage {
  accountData: AccountDataPayload = {
    username: '',
    password: '',
    mail: '',
    biometricData: BiometricDataUtil.makeBiometricData([])
  }
  private readonly accountService: AccountService = inject(AccountService);
  private readonly localDatabaseService: LocalFaceDbService = inject(LocalFaceDbService);

  setBiometricData(data: BiometricData) {
    this.accountData.biometricData = data;
    console.log('mon accountData', this.accountData);
  }

  setAccountData(data: AccountDataPayload): void {
    this.accountData = {...data, biometricData: this.accountData.biometricData};
  }

  sendModification(): void {
    this.accountService.sendModification(this.accountData)
      .pipe(
        switchMap((account: Account) =>
          !account.isEmpty ?
            this.localDatabaseService.addOrUpdate(account.username, this.accountData.biometricData)
            : of(EMPTY)
        )
      )
      .subscribe();
  }
}
