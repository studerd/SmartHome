import {AccountDataPayload} from '../data';
import {FormControl, FormGroup, Validators} from '@angular/forms';

export class AccountUtil{
  static getEmptyAccountData():AccountDataPayload{
    return {
      mail: '', password: '', username: ''

    }
  }
  static getAccountDetailFormGroup(payload:AccountDataPayload):FormGroup{
    return new FormGroup<any>({
      mail: new FormControl(payload.mail,[Validators.required]),
      password: new FormControl(payload.password, [Validators.required]),
      username:new FormControl(payload.username, [Validators.required])
    })
  }
}
