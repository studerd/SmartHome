import { Component } from '@angular/core';
import {FaceRecognition} from '../../component';

@Component({
  selector: 'app-account-detail-page',
  imports: [
    FaceRecognition
  ],
  templateUrl: './account-detail-page.html',
  standalone: true,
  styleUrl: './account-detail-page.scss'
})
export class AccountDetailPage {

}
