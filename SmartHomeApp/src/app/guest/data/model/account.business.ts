import {Business} from '@core';

export interface Account extends Business {
  username: string;
  biometricData?: number[];
  isAdmin: boolean;
}
