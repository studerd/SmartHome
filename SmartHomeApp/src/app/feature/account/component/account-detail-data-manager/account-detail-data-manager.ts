import {Component} from '@angular/core';
import {AccountDataPayload} from '../../data';
import {AccountUtil} from '../../util';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-account-detail-data-manager',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './account-detail-data-manager.html',
  standalone: true,
  styleUrl: './account-detail-data-manager.scss'
})
export class AccountDetailDataManager {
  payload: AccountDataPayload = AccountUtil.getEmptyAccountData();
  form: FormGroup = AccountUtil.getAccountDetailFormGroup(this.payload);

  get username(): FormControl {
    return this.form.get('username') as FormControl;
  }
  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }
  get email():FormControl {
    return this.form.get('mail') as FormControl;
  }
}
