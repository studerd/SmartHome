import {BiometricData} from '@shared';

export interface AccountDataPayload {
  id?: string;
  username: string;
  password: string;
  mail: string;
  biometricData: BiometricData
}
