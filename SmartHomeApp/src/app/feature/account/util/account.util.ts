import {Account, AccountDataPayload, AccountDto} from '../data';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {BiometricDataUtil} from '../../../shared/ui/face-recognition/util/biometric-data.util';


export class AccountUtil {
  static fromDto(dto: AccountDto): Account {
    return {
      biometricData: dto.biometricData,
      id: dto.credential_id,
      isEmpty: false,
      str: dto.username,
      username: dto.username,
      isAdmin: dto.isAdmin
    }
  }

  static getEmpty(): Account {
    return {
      id: '', isAdmin: false, isEmpty: true, str: '', username: ''

    }
  }

  static toDto(bus: Account): AccountDto {
    return {
      biometricData: bus.biometricData,
      credential_id: bus.id,
      username: bus.username,
      isAdmin: bus.isAdmin
    }
  }

  static getEmptyAccountData(): AccountDataPayload {
    return {
      mail: '', password: '', username: '', biometricData: BiometricDataUtil.makeBiometricData([])
    }
  }

  static getAccountDetailFormGroup(payload: AccountDataPayload): FormGroup {
    return new FormGroup<any>({
      mail: new FormControl(payload.mail, [Validators.required]),
      password: new FormControl(payload.password, [Validators.required]),
      username: new FormControl(payload.username, [Validators.required])
    })
  }
}
