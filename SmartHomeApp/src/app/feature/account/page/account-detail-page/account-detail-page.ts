import {Component, inject} from '@angular/core';
import {AccountDataPayload, EnrollmentBuildResult} from '../../data';
import {AccountDetailDataManager} from '../../component';
import {FaceRecognitionManager} from '@shared';
import {AccountService} from '../../service/account.service';

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
  accountData: AccountDataPayload = {username: '', password: '', mail: ''}
  private readonly accountService:AccountService = inject(AccountService);
  setBiometricData(data: Float32Array) {
    this.accountData.biometricData = data;
    console.log('mon accountData', this.accountData);
  }
  sendModification():void{

  }
}
