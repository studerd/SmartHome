import {Component} from '@angular/core';
import {FaceRecognition} from '@guest';
import {AccountDataPayload, EnrollmentBuildResult} from '../../data';
import {AccountDetailDataManager} from '../../component';
import {FaceRecognitionManager} from '@shared';

@Component({
  selector: 'app-account-detail-page',
  imports: [
    FaceRecognition,
    AccountDetailDataManager,
    FaceRecognitionManager
  ],
  templateUrl: './account-detail-page.html',
  standalone: true,
  styleUrl: './account-detail-page.scss'
})
export class AccountDetailPage {
  accountData: AccountDataPayload = {username: '', password: '', mail: ''}

  setBiometricData(data: EnrollmentBuildResult) {
    this.accountData.biometricData = data;
    console.log('mon accountData', this.accountData);
  }
}
