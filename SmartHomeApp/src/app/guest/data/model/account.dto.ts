import {Dto} from '@core';

export interface AccountDto extends Dto {
  credential_id: string;
  username: string;
  isAdmin: boolean;
  biometricData?: number[];
}
