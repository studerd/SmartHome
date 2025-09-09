import {AccountDto} from '@guest';

export interface AppData {
  app_id: string;
  isInitialized: boolean;
  superAdmin?: AccountDto;
}
