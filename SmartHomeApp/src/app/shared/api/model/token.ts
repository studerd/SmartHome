import {IsEmpty} from '@core';

export interface Token extends IsEmpty{
  token: string;
  refreshToken: string;
}
