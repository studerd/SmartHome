import {AccountDataPayload} from '../../../account/data';

export interface CreateConfigPayload {
  id: string;
  superAdminData: AccountDataPayload;
}
